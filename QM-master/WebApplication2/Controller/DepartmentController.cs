using LinqKit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        [Authorize(Roles = "Initi,Initiator,Manager,Admin")]
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

            var context = _uow.GetContext();

            // Dynamic Update: propagate name changes to Risks and Requests
            if (department.Id > 0 && !string.IsNullOrEmpty(department.Name))
            {
                var oldDepartment = await context.Departments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.Id == department.Id);

                if (oldDepartment != null && oldDepartment.Name != department.Name)
                {
                    var risksToUpdate = await context.Risks
                        .Where(r => r.Department == oldDepartment.Name)
                        .ToListAsync();
                    foreach (var r in risksToUpdate)
                    {
                        r.Department = department.Name;
                    }

                    var requestsToUpdate = await context.RiskRequests
                        .Where(r => r.Department == oldDepartment.Name)
                        .ToListAsync();
                    foreach (var req in requestsToUpdate)
                    {
                        req.Department = department.Name;
                    }
                }
            }

            var _manager = new Manager<Department>(_uow);
            var createdDepartment = await _manager.AddUpdateAsync(department);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDepartments), new { id = createdDepartment.Id }, createdDepartment);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var _manager = new Manager<Department>(_uow);
            var record = await _manager.GetByIdAsync(id);
            if (record == null)
                return NotFound("Record not found.");

            // Relational Delete block: verify Department is not connected to a Risk
            var context = _uow.GetContext();
            var isConnected = await context.Risks.AnyAsync(r => r.Department == record.Name);
            if (isConnected)
            {
                return BadRequest(new { Message = "هذا العنصر مرتبط بخطر يجب عليك إزالته من الخطر أولا" });
            }

            await _manager.DeleteAsync(record);
            await _uow.SaveChangesAsync();

            return Ok(new { Message = "Deleted successfully." });
        }
    }
}
