using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Data;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Models.DTO;
using QM.Utility;
using System.Linq.Expressions;
using System.Security.Claims;
using static QM.Models.Enums;

namespace QM.Controller
{
    [Route("api/action")]
    [ApiController]
    public class ActionsController : BaseController
    {
        public ActionsController(IUnitOfWork uow) : base(uow) { }

        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetActions(
            int? id = null,
            string? name = null,
            string? description = null,
            bool? type = null,
            bool? custom = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            String? include = null)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);

            var filter = PredicateBuilder.New<Actions>(true);

            if (id.HasValue)
            {
                filter = filter.And(a => a.Id == id);
            }

            if (!string.IsNullOrEmpty(description))
            {
                filter = filter.And(a => a.ActionDescription.Contains(description));
            }

            if (type.HasValue)
            {
                var actionType = type.Value ? ActionType.Reduction : ActionType.Avoidance;
                filter = filter.And(a => a.ActionType == actionType);
            }

            // Honor explicit custom filter when given.
            if (custom.HasValue)
            {
                filter = filter.And(a => a.Custom == custom);
            }
            else if (!isAdmin)
            {
                // Non-admins default to seeing only approved (Custom=false) items in dropdowns.
                filter = filter.And(a => a.Custom == false || a.Custom == null);
            }

            var _manager = new Manager<Actions>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }

        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateAction([FromBody] Actions action)
        {
            if (action == null)
                return BadRequest("Action data is null.");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
            action.Custom = !isAdmin;

            var _manager = new Manager<Actions>(_uow);
            var createdAction = await _manager.AddUpdateAsync(action);
            await _uow.SaveChangesAsync();

            return CreatedAtAction(nameof(GetActions), new { id = createdAction.Id }, createdAction);
        }
    }
}
