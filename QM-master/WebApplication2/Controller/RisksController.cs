using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Models.DTO;
using QM.Models.Mapping;
using QM.Utility;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Threading.Tasks;
using static QM.Models.Enums;

namespace QM.Controller
{
    [Route("api/risk")]
    [ApiController]
    public class RisksController : BaseController
    {
        public RisksController(IUnitOfWork uow) : base(uow) { }

        // ---------------------------------------------------------------
        // Role helpers
        // ---------------------------------------------------------------
        private bool IsInitiator(string? role) =>
            string.Equals(role, "Initi", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Initiator", StringComparison.OrdinalIgnoreCase);

        private bool IsManager(string? role) =>
            string.Equals(role, "Risk Manager", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "Manager", StringComparison.OrdinalIgnoreCase);

        private bool IsAdmin(string? role) =>
            string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);


        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetRisks(
            int? id = null,
            string? name = null,
            string? description = null,
            string? location = null,
            int? likelihood = null,
            int? impact = null,
            string? categoryName = null,
            string? department = null,
            int? status = null,
            bool? custom = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var filter = PredicateBuilder.New<Risk>(true);
            var stringUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(stringUserId) || !int.TryParse(stringUserId, out int userId))
            {
                return Unauthorized("User isn't logged in.");
            }

            // ----- Role-based scoping -----
            // Exception: when the client explicitly asks for the *catalog* of
            // approved risks (custom=false), we don't apply role scoping —
            // those are global, accepted-by-admin risks that everyone needs
            // to see in dropdowns when logging an incident.
            var isCatalogLookup = custom.HasValue && custom.Value == false;

            if (!isCatalogLookup)
            {
                if (IsInitiator(userRole))
                {
                    // Initiator: only their own risk records.
                    filter = filter.And(r => r.UserId == userId);
                }
                else if (IsManager(userRole))
                {
                    // Manager: own + records owned by users who report to them.
                    filter = filter.And(r =>
                        r.UserId == userId ||
                        (r.User != null && r.User.ManagerId == userId)
                    );
                }
                else
                {
                    // Admin: only sees risks that a manager has explicitly
                    // redirected (ReDirected == true). Anything still pending
                    // at the manager stage is invisible to the admin.
                    filter = filter.And(r => r.ReDirected == true);
                }
            }

            // ----- Field filters -----
            if (id.HasValue)
                filter = filter.And(r => r.Id == id);

            if (!string.IsNullOrEmpty(name))
                filter = filter.And(r => r.RiskName.Contains(name));

            if (!string.IsNullOrEmpty(description))
                filter = filter.And(r => r.RiskDescription.Contains(description));

            if (!string.IsNullOrEmpty(location))
                filter = filter.And(r => r.Location.Contains(location));

            if (likelihood.HasValue)
                filter = filter.And(r => (int)r.likelihood == likelihood);

            if (impact.HasValue)
                filter = filter.And(r => (int)r.Impact == impact);

            if (!string.IsNullOrEmpty(categoryName))
                filter = filter.And(r => r.CategoryName.Contains(categoryName));

            if (!string.IsNullOrEmpty(department))
                filter = filter.And(r => r.Department.Contains(department));

            if (status.HasValue)
                filter = filter.And(r => (int)r.Status == status);

            if (custom.HasValue)
                filter = filter.And(r => r.Custom == custom);

            var _manager = new Manager<Risk>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }


        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpPost("addUpdate")]
        public async Task<IActionResult> AddUpdateRisk([FromBody] RiskDto dto)
        {
            var stringUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(stringUserId))
                return Unauthorized("User isn't logged in.");

            if (!int.TryParse(stringUserId, out int userId))
                return BadRequest("Invalid User ID in token.");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (dto == null) return BadRequest("Data is null");

            // 1. Initialize Managers
            var riskManager = new Manager<Risk>(_uow);
            var notificationManager = new Manager<NotificationModel>(_uow);

            // 2. Fetch existing risk with its mappings
            var includeList = new List<string> { "RiskActions", "RiskCauses", "RiskGoals" };
            var risk = (dto.Id.HasValue && dto.Id.Value > 0)
                ? await riskManager.GetByIdAsync(dto.Id.Value, includeList)
                : null;

            bool isNew = (risk == null);

            if (isNew)
            {
                risk = new Risk
                {
                    RiskActions = new List<RiskActionMapping>(),
                    RiskCauses = new List<RiskCauseMapping>(),
                    RiskGoals = new List<RiskStrategicGoalMapping>()
                };
            }
            else
            {
                // Authorization on update:
                //  - Initiator: only their own.
                //  - Manager: own or one of their reports.
                //  - Admin: anything.
                if (IsInitiator(userRole) && risk.UserId != userId)
                    return Forbid();

                if (IsManager(userRole) && risk.UserId != userId)
                {
                    // Verify the owner reports to this manager.
                    var ctx = _uow.GetContext();
                    var ownerManagerId = await ctx.Users
                        .Where(u => u.Id == risk.UserId)
                        .Select(u => u.ManagerId)
                        .FirstOrDefaultAsync();

                    if (ownerManagerId != userId)
                        return Forbid();
                }

                risk.RiskActions ??= new List<RiskActionMapping>();
                risk.RiskCauses ??= new List<RiskCauseMapping>();
                risk.RiskGoals ??= new List<RiskStrategicGoalMapping>();

                risk.RiskActions.Clear();
                risk.RiskCauses.Clear();
                risk.RiskGoals.Clear();
            }

            // 3. Map DTO to Entity
            risk.RiskName = dto.RiskName;
            risk.Department = dto.Department;
            risk.RiskDescription = dto.RiskDescription;
            risk.Location = dto.Location;
            risk.likelihood = dto.likelihood;
            risk.Impact = dto.Impact;
            risk.ResponsibleId = dto.ResponsibleId;
            risk.CategoryName = dto.CategoryName;
            risk.Status = dto.Status ?? RequestStatus.InProgress;

            // Preserve original creator on edits.
            if (isNew)
            {
                risk.UserId = userId;
            }

            // Custom flag rules:
            //  - Admin creates / edits → Custom = false (it's a "real" risk in the catalog).
            //  - When Status becomes Accepted → Custom = false (admin-approved).
            //  - Otherwise → Custom = true (still a suggestion).
            risk.Custom = (IsAdmin(userRole) || risk.Status == RequestStatus.Accepted) ? false : true;

            // ReDirected: true when a Manager has handled it (forwarded to admin).
            // Do NOT reset it when the admin acts — once redirected, it must stay
            // true so the risk remains visible in the admin's history (سجلاتي).
            if (IsManager(userRole))
                risk.ReDirected = true;
            else if (IsInitiator(userRole))
                risk.ReDirected = false;
            // Admin: leave ReDirected unchanged.

            // 4. Re-map the many-to-many mappings.
            foreach (var actionDto in dto.Actions ?? Enumerable.Empty<ActionInputDto>())
            {
                if (actionDto == null) continue;

                if ((actionDto.Id == null || actionDto.Id == 0) &&
                    string.IsNullOrWhiteSpace(actionDto.ActionDescription))
                    continue;

                var mapping = new RiskActionMapping();

                if (actionDto.Id == null || actionDto.Id == 0)
                {
                    mapping.Action = new Actions
                    {
                        ActionDescription = actionDto.ActionDescription,
                        ActionType = actionDto.ActionType ?? ActionType.Reduction,
                        Custom = !IsAdmin(userRole)
                    };
                }
                else
                {
                    mapping.ActionID = actionDto.Id.Value;
                }

                risk.RiskActions.Add(mapping);
            }

            foreach (var causeDto in dto.Causes ?? Enumerable.Empty<CauseDto>())
            {
                if (causeDto == null) continue;

                if ((causeDto.Id == null || causeDto.Id == 0) &&
                    string.IsNullOrWhiteSpace(causeDto.CauseDescription))
                    continue;

                var mapping = new RiskCauseMapping();

                if (causeDto.Id == null || causeDto.Id == 0)
                {
                    mapping.Cause = new Cause
                    {
                        CauseDescription = causeDto.CauseDescription,
                        Custom = !IsAdmin(userRole)
                    };
                }
                else
                {
                    mapping.CauseID = causeDto.Id.Value;
                }

                risk.RiskCauses.Add(mapping);
            }

            if (dto.StrategicGoals != null)
            {
                foreach (var goalDto in dto.StrategicGoals)
                {
                    if (goalDto?.Id == null || goalDto.Id == 0) continue;

                    risk.RiskGoals.Add(new RiskStrategicGoalMapping
                    {
                        StrategicGoalId = goalDto.Id.Value,
                        Custom = !IsAdmin(userRole)
                    });
                }
            }

            // 5. Save
            await riskManager.AddUpdateAsync(risk);

            // 6. Notification routing
            await CreateRiskNotification(notificationManager, risk, isNew, userRole, userId);

            await _uow.SaveChangesAsync();

            return Ok(risk);
        }

        private async Task CreateRiskNotification(
            Manager<NotificationModel> notifManager,
            Risk risk,
            bool isNew,
            string? userRole,
            int actingUserId)
        {
            // New record OR a manager re-directed it → notify admin(s).
            if (isNew && !IsAdmin(userRole))
            {
                await NotifyAllAdmins(notifManager, risk.Id, requestType.Risk);
                return;
            }

            // Manager forwarding (status moved to underReview) → notify admin(s).
            if (!isNew && IsManager(userRole) && risk.Status == RequestStatus.underReview)
            {
                await NotifyAllAdmins(notifManager, risk.Id, requestType.Risk);
                return;
            }

            // Accept/reject → notify the original initiator.
            if (risk.Status == RequestStatus.Accepted)
            {
                await notifManager.AddUpdateAsync(new NotificationModel
                {
                    requestId = risk.Id,
                    UserId = risk.UserId ?? actingUserId,
                    status = notificationType.accept,
                    requestType = requestType.Risk,
                    createdAt = DateTime.Now
                });
                return;
            }

            if (risk.Status == RequestStatus.Rejected)
            {
                await notifManager.AddUpdateAsync(new NotificationModel
                {
                    requestId = risk.Id,
                    UserId = risk.UserId ?? actingUserId,
                    status = notificationType.reject,
                    requestType = requestType.Risk,
                    createdAt = DateTime.Now
                });
                return;
            }

            // Default: 'updated' notification to the original initiator.
            await notifManager.AddUpdateAsync(new NotificationModel
            {
                requestId = risk.Id,
                UserId = risk.UserId ?? actingUserId,
                status = isNew ? notificationType.created : notificationType.updated,
                requestType = requestType.Risk,
                createdAt = DateTime.Now
            });
        }

        private async Task NotifyAllAdmins(
            Manager<NotificationModel> notifManager, int requestId, requestType type)
        {
            var ctx = _uow.GetContext();
            var adminRoleId = await ctx.Roles
                .Where(r => r.Name == "Admin")
                .Select(r => (int?)r.Id)
                .FirstOrDefaultAsync();

            if (adminRoleId == null) return;

            var adminIds = await ctx.UserRoles
                .Where(ur => ur.RoleId == adminRoleId.Value)
                .Select(ur => ur.UserId)
                .ToListAsync();

            foreach (var adminUserId in adminIds)
            {
                await notifManager.AddUpdateAsync(new NotificationModel
                {
                    requestId = requestId,
                    UserId = adminUserId,
                    status = notificationType.created,
                    requestType = type,
                    createdAt = DateTime.Now
                });
            }
        }
    }
}
