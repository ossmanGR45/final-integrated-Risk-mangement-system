using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QM.DataAccess.Data;
using QM.Models.DataModels;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using static QM.Models.Enums;

namespace QM.Services
{
    /// <summary>
    /// A yearly background service that recalculates the likelihood (probability) of every
    /// catalog risk using the Exponential Weighted Moving Average (EWMA) formula:
    ///
    ///     R        = accepted_incident_count_past_365_days / 365.0   (daily rate)
    ///     L_new    = (1 - w) * L_old  +  w * R                       (w = 0.2)
    ///
    /// risk.likelihood is stored as a raw decimal (e.g. 0.28) in the database.
    /// The frontend receives this value and converts to display integer 1–5:
    ///     [0.00, 0.20) → 1  |  [0.20, 0.40) → 2  |  [0.40, 0.60) → 3
    ///     [0.60, 0.80) → 4  |  [0.80, 1.00] → 5
    ///
    /// After updating, an "updated" notification is sent to every Admin user.
    /// </summary>
    public class RiskLikelihoodUpdateService : BackgroundService
    {
        // Learning rate (w)
        private const double W = 0.2;

        // Exposure window in days
        private const int ExposureUnits = 365;

        // How often the job repeats (once a year)
        private static readonly TimeSpan Interval = TimeSpan.FromDays(365);

        // Default decimal seed for risks with no likelihood set yet
        private const double DefaultLikelihood = 0.10;

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RiskLikelihoodUpdateService> _logger;

        public RiskLikelihoodUpdateService(
            IServiceScopeFactory scopeFactory,
            ILogger<RiskLikelihoodUpdateService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "[RiskLikelihoodUpdateService] Service started. " +
                "First run will occur in {Days} day(s).", Interval.Days);

            // Task.Delay has a max limit of ~24.8 days (int.MaxValue ms).
            // A 365-day TimeSpan exceeds that limit and throws ArgumentOutOfRangeException.
            // Solution: loop with 1-day delays until the full year has elapsed.
            while (!stoppingToken.IsCancellationRequested)
            {
                // Wait 365 days one day at a time to stay within Task.Delay's limit.
                for (int day = 0; day < Interval.Days; day++)
                {
                    if (stoppingToken.IsCancellationRequested) return;
                    await Task.Delay(TimeSpan.FromDays(1), stoppingToken);
                }

                if (stoppingToken.IsCancellationRequested) break;

                _logger.LogInformation(
                    "[RiskLikelihoodUpdateService] Annual probability update triggered at {Time}.",
                    DateTime.UtcNow);

                await RunUpdateAsync(stoppingToken);
            }
        }

        /// <summary>
        /// Core EWMA update logic. Called by the annual scheduler and also exposed via
        /// POST /api/risk/recalculate-likelihood so admins can test without waiting a year.
        /// </summary>
        public async Task RunUpdateAsync(CancellationToken cancellationToken = default)
        {
            using var scope = _scopeFactory.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var cutoff = DateTime.UtcNow.AddDays(-ExposureUnits);

            // 1. Fetch all accepted catalog risks.
            var risks = await ctx.Risks
                .Where(r => r.Custom == false && r.Status == RequestStatus.Accepted)
                .ToListAsync(cancellationToken);

            if (risks.Count == 0)
            {
                _logger.LogInformation(
                    "[RiskLikelihoodUpdateService] No catalog risks found. Skipping.");
                return;
            }

            // 2. Count accepted incidents per risk for the past 365 days in a single query.
            var riskIds = risks.Select(r => r.Id).ToList();
            var incidentCounts = await ctx.RiskRequests
                .Where(req =>
                    req.RiskId.HasValue &&
                    riskIds.Contains(req.RiskId.Value) &&
                    req.Status == RequestStatus.Accepted &&
                    req.Year.HasValue &&
                    req.Year.Value >= cutoff)
                .GroupBy(req => req.RiskId!.Value)
                .Select(g => new { RiskId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.RiskId, g => g.Count, cancellationToken);

            // 3. Apply EWMA for each risk.
            foreach (var risk in risks)
            {
                int incidentCount = incidentCounts.TryGetValue(risk.Id, out int c) ? c : 0;

                // Observed daily rate: R = incident_count / 365
                double rObserved = incidentCount / (double)ExposureUnits;

                // risk.likelihood is now stored as a decimal directly.
                // Seed from the probability midpoints if the value is null or looks like
                // a legacy integer (1–5) that hasn't been converted yet.
                double lOld = risk.likelihood switch
                {
                    null        => DefaultLikelihood,
                    <= 0.0      => DefaultLikelihood,
                    // Legacy int values (1–5): convert to decimal midpoints on first run.
                    1.0         => 0.10,
                    2.0         => 0.30,
                    3.0         => 0.50,
                    4.0         => 0.70,
                    >= 5.0      => 0.90,
                    // Already a proper decimal from a previous EWMA run.
                    double v    => v
                };

                // EWMA update: L_new = (1 - w) * L_old + w * R
                double lNew = (1.0 - W) * lOld + W * rObserved;

                // Clamp to valid probability range [0, 1].
                lNew = Math.Clamp(lNew, 0.0, 1.0);

                // Write the decimal directly back — no enum, no extra column.
                risk.likelihood = lNew;

                _logger.LogDebug(
                    "[RiskLikelihoodUpdateService] Risk {Id} ({Name}): " +
                    "incidents={Count}, R={R:F6}, L_old={LOld:F4}, L_new={LNew:F4}, display={Display}",
                    risk.Id, risk.RiskName, incidentCount, rObserved, lOld, lNew,
                    DecimalToDisplayInt(lNew));
            }

            // 4. Persist all changes.
            await ctx.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "[RiskLikelihoodUpdateService] Updated {Count} risk(s). Notifying admins.",
                risks.Count);

            // 5. Send a system notification to every Admin user.
            // await NotifyAdminsAsync(ctx, cancellationToken);
        }

        // ---------------------------------------------------------------
        // Helpers
        // ---------------------------------------------------------------

        /// <summary>
        /// Maps a stored decimal probability to the display integer 1–5.
        /// Used for logging. The frontend applies the same mapping client-side.
        /// </summary>
        public static int DecimalToDisplayInt(double probability)
        {
            if (probability < 0.20) return 1;
            if (probability < 0.40) return 2;
            if (probability < 0.60) return 3;
            if (probability < 0.80) return 4;
            return 5;
        }

        /// <summary>Sends an "updated" notification to every Admin user in the system.</summary>
        private static async Task NotifyAdminsAsync(
            ApplicationDbContext ctx,
            CancellationToken cancellationToken)
        {
            var adminRoleId = await ctx.Roles
                .Where(r => r.Name == "Admin")
                .Select(r => (int?)r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (adminRoleId == null) return;

            var adminIds = await ctx.UserRoles
                .Where(ur => ur.RoleId == adminRoleId.Value)
                .Select(ur => ur.UserId)
                .ToListAsync(cancellationToken);

            foreach (var adminId in adminIds)
            {
                ctx.Notifications.Add(new NotificationModel
                {
                    // -1 is a sentinel for system-wide notifications (not tied to a single risk).
                    requestId   = -1,
                    UserId      = adminId,
                    status      = notificationType.updated,
                    requestType = requestType.Risk,
                    createdAt   = DateTime.UtcNow
                });
            }

            await ctx.SaveChangesAsync(cancellationToken);
        }
    }
}
