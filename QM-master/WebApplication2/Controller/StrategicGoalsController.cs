using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Utility;
using System.Linq.Expressions;

namespace QM.Controller
{
    [Route("api/strategicgoal")]
    [ApiController]
    public class StrategicGoalsController : BaseController
    {
        public StrategicGoalsController(IUnitOfWork uow) : base(uow) { }

        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetStrategicGoals(
            int? id = null,
            string? description = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var filter = PredicateBuilder.New<StrategicGoal>(true);

            if (id.HasValue)
                filter = filter.And(s => s.Id == id);

            if (!string.IsNullOrEmpty(description))
                filter = filter.And(s => s.GoalDescription.Contains(description));

            var _manager = new Manager<StrategicGoal>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateStrategicGoal([FromBody] StrategicGoal strategicGoal)
        {
            if (strategicGoal == null)
                return BadRequest("Strategic Goal data is null.");

            var _manager = new Manager<StrategicGoal>(_uow);
            var createdStrategicGoal = await _manager.AddUpdateAsync(strategicGoal);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStrategicGoals), new { id = createdStrategicGoal.Id }, createdStrategicGoal);
        }
    }
}
