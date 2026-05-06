using Humanizer;
using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Models.DTO;
using QM.Models.Mapping;
using QM.Utility;
using System.Linq.Expressions;
using System.Security.Claims;
using static QM.Models.Enums;

namespace QM.Controller
{
    [Route("api/request")]
    [Route("api/requests")]
    [ApiController]
    public class RequestsController : BaseController
    {
        public RequestsController(IUnitOfWork uow) : base(uow) { }

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
        public async Task<IActionResult> GetRequests(
            int? id = null,
            DateTime? year = null,
            int? likelihood = null,
            int? impact = null,
            DateTime? expectedTime = null,
            int? responsibleId = null,
            string? description = null,
            int? status = null,
            bool? occured = null,
            // NEW: pending=true returns InProgress+underReview only;
            //      pending=false returns Accepted+Rejected only (the "history" / سجلاتي view);
            //      pending=null returns everything (subject to role filter).
            bool? pending = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var filter = PredicateBuilder.New<Request>(true);
            var stringUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(stringUserId) || !int.TryParse(stringUserId, out int userId))
            {
                return Unauthorized("User isn't logged in.");
            }

            // ----- Role-based scoping -----
            if (IsInitiator(userRole))
            {
                // Initiator: only their own requests.
                filter = filter.And(r => r.UserId == userId);
            }
            else if (IsManager(userRole))
            {
                // Risk Manager: their own requests AND requests by users whose ManagerId == this user's id.
                filter = filter.And(r =>
                    r.UserId == userId ||
                    (r.User != null && r.User.ManagerId == userId)
                );
            }
            else
            {
                // Admin: only sees requests that a manager has explicitly
                // redirected (ReDirected == true). Anything still in the
                // manager queue is invisible to the admin until forwarded.
                filter = filter.And(r => r.ReDirected == true);
            }

            // ----- Pending vs history split -----
            if (pending.HasValue)
            {
                if (pending.Value)
                {
                    filter = filter.And(r =>
                        r.Status == RequestStatus.InProgress ||
                        r.Status == RequestStatus.underReview
                    );
                }
                else
                {
                    filter = filter.And(r =>
                        r.Status == RequestStatus.Accepted ||
                        r.Status == RequestStatus.Rejected
                    );
                }
            }

            // ----- Field filters -----
            if (id.HasValue)
                filter = filter.And(r => r.Id == id);

            if (year.HasValue)
                filter = filter.And(r => r.Year == year);

            if (likelihood.HasValue)
                filter = filter.And(r => (int)r.Likelihood == likelihood);

            if (impact.HasValue)
                filter = filter.And(r => (int)r.Impact == impact);

            if (expectedTime.HasValue)
                filter = filter.And(r => r.ExpectedTime == expectedTime);

            if (responsibleId.HasValue)
                filter = filter.And(r => r.ResponsibleId == responsibleId);

            if (!string.IsNullOrEmpty(description))
                filter = filter.And(r => r.Description.Contains(description));

            if (status.HasValue)
                filter = filter.And(r => (int)r.Status == status);

            if (occured.HasValue)
                filter = filter.And(r => r.Occured == occured);

            var _manager = new Manager<Request>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }


        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpPost("addUpdate")]
        public async Task<IActionResult> AddUpdate([FromBody] RequestDto dto)
        {
            var stringUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(stringUserId))
                return Unauthorized("User isn't logged in.");

            if (!int.TryParse(stringUserId, out int userId))
                return BadRequest("Invalid User ID in token.");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (dto == null) return BadRequest("Data is null");

            var _manager = new Manager<Request>(_uow);
            Request request;
            bool isNew = (dto.Id == 0);

            // 1. Logic for Add vs Update
            if (isNew)
            {
                // New requests always start in the waiting (InProgress) state.
                request = new Request { Status = RequestStatus.InProgress, UserId = userId };
                await _manager.AddUpdateAsync(request);
            }
            else
            {
                request = await _manager.GetByIdAsync(
                    dto.Id,
                    new List<string> { "RequestActions", "RequestCauses", "RequestGoals" }
                );
                if (request == null) return NotFound();

                // Authorization: an Initiator can only modify their OWN request.
                // A Manager can modify their own or a request from a user reporting to them.
                // Admin can modify anything.
                if (IsInitiator(userRole) && request.UserId != userId)
                    return Forbid();
            }

            // 2. Map basic data
            request.Description = dto.Description;
            request.Department = dto.Department;
            request.Likelihood = dto.Likelihood;
            request.Impact = dto.Impact;
            request.PostLikelihood = dto.PostLikelihood;
            request.PostImpact = dto.PostImpact;
            request.Year = dto.Year;
            request.Category = dto.Category;
            request.ExpectedTime = dto.ExpectedTime;
            request.Occured = dto.Occured;

            // Only update UserId on the first create; never overwrite the original creator.
            if (isNew)
            {
                request.UserId = userId;
            }

            request.ResponsibleId = dto.ResponsibleId;
            request.RiskId = dto.RiskId;
            // ReDirected: true only when a Manager has handled it (forwarded to admin).
            // Do NOT reset it when the admin acts — once redirected, it must stay
            // true so the request remains visible in the admin's history (سجلاتي).
            if (IsManager(userRole))
                request.ReDirected = true;
            else if (IsInitiator(userRole))
                request.ReDirected = false;
            // Admin: leave ReDirected unchanged.

            request.RequestActions ??= new List<RequestActionMapping>();
            request.RequestCauses ??= new List<RequestCauseMapping>();
            request.RequestGoals ??= new List<RequestStrategicGoalMapping>();

            // 3. Sync Actions / Causes / Goals
            request.RequestActions.Clear();
            foreach (var actionDto in dto.Actions ?? Enumerable.Empty<ActionInputDto>())
            {
                if (actionDto == null) continue;

                if ((actionDto.Id == null || actionDto.Id == 0) &&
                    string.IsNullOrWhiteSpace(actionDto.ActionDescription))
                    continue;

                request.RequestActions.Add(new RequestActionMapping
                {
                    ActionID = actionDto.Id ?? 0,
                    Action = (actionDto.Id == 0 || actionDto.Id == null) ? new Actions
                    {
                        ActionDescription = actionDto.ActionDescription,
                        ActionType = actionDto.ActionType ?? ActionType.Reduction,
                        Custom = !IsAdmin(userRole)
                    } : null
                });
            }

            request.RequestCauses.Clear();
            foreach (var causeDto in dto.Causes ?? Enumerable.Empty<CauseDto>())
            {
                if (causeDto == null) continue;

                if ((causeDto.Id == null || causeDto.Id == 0) &&
                    string.IsNullOrWhiteSpace(causeDto.CauseDescription))
                    continue;

                request.RequestCauses.Add(new RequestCauseMapping
                {
                    CauseID = causeDto.Id ?? 0,
                    Cause = (causeDto.Id == 0 || causeDto.Id == null) ? new Cause
                    {
                        CauseDescription = causeDto.CauseDescription,
                        Custom = !IsAdmin(userRole)
                    } : null
                });
            }

            request.RequestGoals.Clear();
            foreach (var goalDto in dto.StrategicGoals ?? Enumerable.Empty<StrategicGoalDto>())
            {
                if (goalDto == null) continue;

                if ((goalDto.Id == null || goalDto.Id == 0) &&
                    string.IsNullOrWhiteSpace(goalDto.GoalDescription))
                    continue;

                request.RequestGoals.Add(new RequestStrategicGoalMapping
                {
                    StrategicGoalID = goalDto.Id ?? 0,
                    StrategicGoal = (goalDto.Id == 0 || goalDto.Id == null) ? new StrategicGoal
                    {
                        GoalDescription = goalDto.GoalDescription
                    } : null
                });
            }

            // 4. Status transitions & notifications
            await ProcessStatusAndNotifications(request, dto, isNew, userRole, userId);

            // 5. Save everything in one transaction.
            await _uow.SaveChangesAsync();

            return Ok(request);
        }

        private async Task ProcessStatusAndNotifications(
            Request request, RequestDto dto, bool isNew, string? userRole, int actingUserId)
        {
            var _notifManager = new Manager<NotificationModel>(_uow);
            notificationType finalNotifType;

            if (isNew)
            {
                // New record: stays in InProgress (set on create above).
                finalNotifType = notificationType.created;

                await _notifManager.AddUpdateAsync(new NotificationModel
                {
                    requestId = request.Id,
                    UserId = actingUserId,            // The creator gets a "created" trace.
                    status = finalNotifType,
                    requestType = requestType.Incident,
                    createdAt = DateTime.Now
                });
                return;
            }

            // Existing record being updated. The status decides what happens.
            if (dto.Status.HasValue)
            {
                request.Status = dto.Status.Value;
                request.rejectReason = dto.rejectReason;

                switch (dto.Status.Value)
                {
                    case RequestStatus.Accepted:
                        finalNotifType = notificationType.accept;
                        // Notify the original initiator.
                        await _notifManager.AddUpdateAsync(new NotificationModel
                        {
                            requestId = request.Id,
                            UserId = request.UserId ?? actingUserId,
                            status = finalNotifType,
                            requestType = requestType.Incident,
                            createdAt = DateTime.Now
                        });
                        return;

                    case RequestStatus.Rejected:
                        finalNotifType = notificationType.reject;
                        // Notify the original initiator.
                        await _notifManager.AddUpdateAsync(new NotificationModel
                        {
                            requestId = request.Id,
                            UserId = request.UserId ?? actingUserId,
                            status = finalNotifType,
                            requestType = requestType.Incident,
                            createdAt = DateTime.Now
                        });
                        return;

                    case RequestStatus.underReview:
                        // Manager forwarded → notify admin(s).
                        await NotifyAllAdmins(_notifManager, request.Id, requestType.Incident);
                        return;

                    case RequestStatus.InProgress:
                    default:
                        finalNotifType = notificationType.updated;
                        await _notifManager.AddUpdateAsync(new NotificationModel
                        {
                            requestId = request.Id,
                            UserId = request.UserId ?? actingUserId,
                            status = finalNotifType,
                            requestType = requestType.Incident,
                            createdAt = DateTime.Now
                        });
                        return;
                }
            }

            // No explicit status change → just an update notification to the original initiator.
            await _notifManager.AddUpdateAsync(new NotificationModel
            {
                requestId = request.Id,
                UserId = request.UserId ?? actingUserId,
                status = notificationType.updated,
                requestType = requestType.Incident,
                createdAt = DateTime.Now
            });
        }

        // Helper: emit one notification per admin user.
        private async Task NotifyAllAdmins(
            Manager<NotificationModel> notifManager, int requestId, requestType type)
        {
            // Resolve all users in the "Admin" role from the underlying DbContext.
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
