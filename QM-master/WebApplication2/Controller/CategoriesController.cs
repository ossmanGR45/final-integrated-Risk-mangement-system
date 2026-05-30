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
    [Route("api/category")]
    [ApiController]
    public class CategoriesController : BaseController
    {
        public CategoriesController(IUnitOfWork uow) : base(uow) { }

        // Any authenticated user can read.
        [Authorize(Roles = "Initi,Initiator,Manager,Admin")]
        [HttpGet]
        public async Task<IActionResult> GetCategories(
            int? id = null,
            string? name = null,
            string? orderBy = null,
            Pagger? paggerBy = null,
            string? include = null)
        {
            var filter = PredicateBuilder.New<Category>(true);

            if (id.HasValue)
                filter = filter.And(c => c.Id == id);

            if (!string.IsNullOrEmpty(name))
                filter = filter.And(c => c.CategoryName.Contains(name));

            var _manager = new Manager<Category>(_uow);
            var records = await _manager.FindAllAsync(filter, orderBy, paggerBy, include?.ToStringList());

            return Ok(records);
        }

        // Admin only. Categories don't have a Custom flag in the schema.
        [Authorize(Roles = "Admin")]
        [HttpPost("create")]
        public async Task<IActionResult> CreateCategory([FromBody] Category category)
        {
            if (category == null)
                return BadRequest("Category data is null.");

            var context = _uow.GetContext();

            // Dynamic Update: propagate name changes to Risks and Requests
            if (category.Id > 0 && !string.IsNullOrEmpty(category.CategoryName))
            {
                var oldCategory = await context.Categories
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == category.Id);

                if (oldCategory != null && oldCategory.CategoryName != category.CategoryName)
                {
                    var risksToUpdate = await context.Risks
                        .Where(r => r.CategoryName == oldCategory.CategoryName)
                        .ToListAsync();
                    foreach (var r in risksToUpdate)
                    {
                        r.CategoryName = category.CategoryName;
                    }

                    var requestsToUpdate = await context.RiskRequests
                        .Where(r => r.Category == oldCategory.CategoryName)
                        .ToListAsync();
                    foreach (var req in requestsToUpdate)
                    {
                        req.Category = category.CategoryName;
                    }
                }
            }

            var _manager = new Manager<Category>(_uow);
            var createdCategory = await _manager.AddUpdateAsync(category);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategories), new { id = createdCategory.Id }, createdCategory);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var _manager = new Manager<Category>(_uow);
            var record = await _manager.GetByIdAsync(id);
            if (record == null)
                return NotFound("Record not found.");

            // Relational Delete block: verify Category is not connected to a Risk
            var context = _uow.GetContext();
            var isConnected = await context.Risks.AnyAsync(r => r.CategoryName == record.CategoryName);
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
