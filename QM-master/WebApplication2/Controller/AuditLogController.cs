using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Utility;
using System.Linq.Expressions;
using System.Security.Claims;

namespace QM.Controller
{
    [Route("api/log")]
    [Route("api/logs")]
    [ApiController]
    public class AuditLogController : BaseController
    {
        public AuditLogController(IUnitOfWork uow) : base(uow) { }

        // Admin-only: list every audit log on the system.
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetLogs(
            int? UserId = null,
            string? Type = null,
            string? TableName = null,
            DateTime? date = null,
            string? OldValues = null,
            string? NewValues = null,
            string? AffectedColumns = null,
            int? PrimaryKey = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var filter = PredicateBuilder.New<AuditLog>(true);

            if (UserId.HasValue)
                filter = filter.And(a => a.UserId == UserId);

            if (!string.IsNullOrEmpty(Type))
                filter = filter.And(a => a.Type.Contains(Type));

            if (!string.IsNullOrEmpty(TableName))
                filter = filter.And(a => a.TableName.Contains(TableName));

            if (date.HasValue)
                filter = filter.And(a => a.DateTime.Date == date.Value.Date);

            if (!string.IsNullOrEmpty(OldValues))
                filter = filter.And(a => a.OldValues.Contains(OldValues));

            if (!string.IsNullOrEmpty(NewValues))
                filter = filter.And(a => a.NewValues.Contains(NewValues));

            if (!string.IsNullOrEmpty(AffectedColumns))
                filter = filter.And(a => a.AffectedColumns.Contains(AffectedColumns));

            if (PrimaryKey.HasValue)
                filter = filter.And(a => a.PrimaryKey == PrimaryKey);

            var _manager = new Manager<AuditLog>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }

        // Any authenticated user: only their own audit entries.
        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyLogs(
            string? Type = null,
            string? TableName = null,
            DateTime? date = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var stringUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(stringUserId) || !int.TryParse(stringUserId, out int userId))
                return Unauthorized();

            var filter = PredicateBuilder.New<AuditLog>(true);
            filter = filter.And(a => a.UserId == userId);

            if (!string.IsNullOrEmpty(Type))
                filter = filter.And(a => a.Type.Contains(Type));

            if (!string.IsNullOrEmpty(TableName))
                filter = filter.And(a => a.TableName.Contains(TableName));

            if (date.HasValue)
                filter = filter.And(a => a.DateTime.Date == date.Value.Date);

            var _manager = new Manager<AuditLog>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());
            return Ok(records);
        }
    }
}
