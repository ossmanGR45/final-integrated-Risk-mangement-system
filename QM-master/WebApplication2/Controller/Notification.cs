using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Utility;
using System.Security.Claims;
using static QM.Models.Enums;

namespace QM.Controller
{
    [Route("api/notification")]
    [ApiController]
    public class NotificationsController : BaseController
    {
        public NotificationsController(IUnitOfWork uow) : base(uow) { }

        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            int? id = null,
            int? userId = null,
            int? requestId = null,
            notificationType? status = null,
            requestType? requestType = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var stringUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(stringUserId) || !int.TryParse(stringUserId, out int currentUserId))
                return Unauthorized("User isn't logged in.");

            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);

            var filter = PredicateBuilder.New<NotificationModel>(true);

            // Non-admin users only ever see their own notifications, regardless of the
            // userId query param. Admins can pass userId to look at someone else's.
            if (!isAdmin)
            {
                filter = filter.And(n => n.UserId == currentUserId);
            }
            else if (userId.HasValue)
            {
                filter = filter.And(n => n.UserId == userId);
            }

            if (id.HasValue)
                filter = filter.And(n => n.Id == id);

            if (requestId.HasValue)
                filter = filter.And(n => n.requestId == requestId);

            if (status.HasValue)
                filter = filter.And(n => n.status == status);

            if (requestType.HasValue)
                filter = filter.And(n => n.requestType == requestType);

            var _manager = new Manager<NotificationModel>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }
    }
}
