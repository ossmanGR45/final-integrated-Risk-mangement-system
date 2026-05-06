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
    [Route("api/cause")]
    [ApiController]
    public class CausesController : BaseController
    {
        public CausesController(IUnitOfWork uow) : base(uow) { }

        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetCauses(
            int? id = null,
            string? description = null,
            bool? custom = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);

            var filter = PredicateBuilder.New<Cause>(true);

            if (id.HasValue)
                filter = filter.And(c => c.Id == id);

            if (!string.IsNullOrEmpty(description))
                filter = filter.And(c => c.CauseDescription.Contains(description));

            // Honor explicit custom filter when given.
            if (custom.HasValue)
            {
                filter = filter.And(c => c.Custom == custom);
            }
            else if (!isAdmin)
            {
                // Non-admin readers only see "approved" (Custom=false) catalog items by default,
                // so the dropdowns in the UI don't surface unapproved suggestions.
                filter = filter.And(c => c.Custom == false || c.Custom == null);
            }

            var _manager = new Manager<Cause>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }

        // Initiators, Managers, and Admins can all add causes.
        // Custom=true unless the creator is Admin.
        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateCause([FromBody] Cause cause)
        {
            if (cause == null)
                return BadRequest("Cause data is null.");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
            cause.Custom = !isAdmin;

            var _manager = new Manager<Cause>(_uow);
            var createdCause = await _manager.AddUpdateAsync(cause);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCauses), new { id = createdCause.Id }, createdCause);
        }
    }
}
