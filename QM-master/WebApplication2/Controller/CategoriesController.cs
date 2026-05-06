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
    [Route("api/category")]
    [ApiController]
    public class CategoriesController : BaseController
    {
        public CategoriesController(IUnitOfWork uow) : base(uow) { }

        // Any authenticated user can read.
        [Authorize(Roles = "Initi,Initiator,Risk Manager,Admin")]
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

            var _manager = new Manager<Category>(_uow);
            var createdCategory = await _manager.AddUpdateAsync(category);
            await _uow.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategories), new { id = createdCategory.Id }, createdCategory);
        }
    }
}
