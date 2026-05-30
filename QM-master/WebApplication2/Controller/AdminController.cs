using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Repo.IRepo;
using QM.Models.DataModels;
using QM.Models.DTO;

namespace QM.Controller
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : BaseController
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;

        public AdminController(
            UserManager<User> userManager,
            RoleManager<IdentityRole<int>> roleManager,
            IUnitOfWork uow) : base(uow)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        /// <summary>
        /// Create a new user. Only accessible by Admin.
        /// </summary>
        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] UserDto model)
        {
            if (model == null)
                return BadRequest(new { Message = "Invalid request body." });

            // Validate that the role exists
            if (!string.IsNullOrEmpty(model.RoleName) && !await _roleManager.RoleExistsAsync(model.RoleName))
            {
                return BadRequest(new { Message = $"Role '{model.RoleName}' does not exist. Please create it first." });
            }

            // Check if user with same Employee ID already exists
            var existingUserById = await _userManager.FindByIdAsync(model.Id.ToString());
            if (existingUserById != null)
            {
                return Conflict(new { Message = $"A user with Employee ID '{model.Id}' already exists." });
            }

            // Check if user with same email already exists
            var existingUser = await _userManager.FindByEmailAsync(model.Email);
            if (existingUser != null)
            {
                return Conflict(new { Message = $"A user with email '{model.Email}' already exists." });
            }

            var user = new User
            {
                UserName = model.Name,
                Email = model.Email,
                Id = model.Id,
                ManagerId = model.ManagerId,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Assign role if provided
                if (!string.IsNullOrEmpty(model.RoleName))
                {
                    await _userManager.AddToRoleAsync(user, model.RoleName);
                }

                return Ok(new
                {
                    Message = "User created successfully.",
                    User = new
                    {
                        EmployeeId = user.Id,
                        user.UserName,
                        user.Email,
                        Role = model.RoleName,
                        user.ManagerId
                    }
                });
            }

            var errorMsg = string.Join(" ", result.Errors.Select(e => e.Description));
            return BadRequest(new { Message = $"Failed to create user. {errorMsg}", Errors = result.Errors });
        }

        /// <summary>
        /// Get all users with their roles. Only accessible by Admin.
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();

            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new
                {
                    EmployeeId = user.Id,
                    user.UserName,
                    user.Email,
                    Roles = roles,
                    user.ManagerId
                });
            }

            return Ok(userList);
        }

        /// <summary>
        /// Update a user's role. Only accessible by Admin.
        /// </summary>
        [HttpPut("update-role")]
        public async Task<IActionResult> UpdateUserRole([FromBody] UpdateRoleDto model)
        {
            if (model == null)
                return BadRequest(new { Message = "Invalid request body." });

            var user = await _userManager.FindByNameAsync(model.UserName);
            if (user == null)
            {
                return NotFound(new { Message = $"User '{model.UserName}' not found." });
            }

            // Validate the new role exists
            if (!await _roleManager.RoleExistsAsync(model.NewRole))
            {
                return BadRequest(new { Message = $"Role '{model.NewRole}' does not exist." });
            }

            // Remove all current roles
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            // Add the new role
            var result = await _userManager.AddToRoleAsync(user, model.NewRole);

            // Update ManagerId if provided
            if (model.ManagerId.HasValue)
            {
                user.ManagerId = model.ManagerId;
                await _userManager.UpdateAsync(user);
            }

            if (result.Succeeded)
            {
                return Ok(new { Message = $"User '{model.UserName}' role updated to '{model.NewRole}'." });
            }

            return BadRequest(new { Message = "Failed to update role.", Errors = result.Errors });
        }

        /// <summary>
        /// Delete a user by EmployeeId. Only accessible by Admin.
        /// </summary>
        [HttpDelete("user/{employeeId}")]
        public async Task<IActionResult> DeleteUser(int employeeId)
        {
            var user = await _userManager.FindByIdAsync(employeeId.ToString());

            if (user == null)
            {
                return NotFound(new { Message = $"User with EmployeeId '{employeeId}' not found." });
            }

            var result = await _userManager.DeleteAsync(user);

            if (result.Succeeded)
            {
                return Ok(new { Message = $"User with EmployeeId '{employeeId}' deleted successfully." });
            }

            return BadRequest(new { Message = "Failed to delete user.", Errors = result.Errors });
        }
    }
}
