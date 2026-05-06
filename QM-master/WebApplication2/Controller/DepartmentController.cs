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
    [Route("api/departments")]
    [ApiController]
    public class DepartmentsController : BaseController
    {
        public DepartmentsController(IUnitOfWork uow) : base(uow) { }

        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetDepartments(
            int? id = null,
            string? name = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var filter = PredicateBuilder.New<Department>(true);

            if (id.HasValue)
                filter = filter.And(c => c.Id == id);

            if (!string.IsNullOrEmpty(name))
                filter = filter.And(c => c.Name.Contains(name));

            var _manager = new Manager<Department>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateDepartment([FromBody] Department department)
        {
            if (department == null)
                return BadRequest("Department data is null.");

            var _manager = new Manager<Department>(_uow);
            var createdDepartment = await _manager.AddUpdateAsync(department);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDepartments), new { id = createdDepartment.Id }, createdDepartment);
        }
    }
}
