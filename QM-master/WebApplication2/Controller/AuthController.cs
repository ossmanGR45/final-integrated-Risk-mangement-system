using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.V4.Pages.Account.Internal;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Managers;
using QM.DataAccess.Repo.IRepo;
using QM.Models;
using QM.Models.DataModels;
using QM.Models.DTO;
using QM.Utility;

namespace QM.Controller
{

    [Route("api/auth")]
    [ApiController]
    public class AuthController : BaseController
    {
        
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        public AuthController(UserManager<User> userManager, IConfiguration configuration,IUnitOfWork uow): base(uow)
        {
            _userManager = userManager;
            _configuration = configuration;
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            var pass = await _userManager.CheckPasswordAsync(user, model.Password);
            

            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {

                var roles = await _userManager.GetRolesAsync(user);


                var token = TokenGenerator.GenerateToken(user, roles, _configuration);
                var refreshToken = TokenGenerator.GenerateRefreshToken();

                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                await _uow.SaveChangesAsync();

                return Ok(new
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    Username = user.UserName,
                    Roles = roles,
                    ExpiresAt = 3600
                });
            }
            //AQAAAAIAAYagAAAAEC4SVa0U/Y2NYcTg3Bx5v6J86N3DIiIhHns3uSEdcaLxbLz5ZL7snfXCj0I2Q+7/Tg==
            //AQAAAAIAAYagAAAAEC4SVa0U/Y2NYcTg3Bx5v6J86N3DIiIhHns3uSEdcaLxbLz5ZL7snfXCj0I2Q+7/Tg==
            return Unauthorized(new { Message = "Invalid username or password"  });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] TokenRequestModel model)
        {
            if (model is null)
                return BadRequest("Invalid client request");


            var user = await _userManager.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == model.RefreshToken);


            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized("Token expired or invalid. Please login again.");
            }


            var roles = await _userManager.GetRolesAsync(user);
            var newAccessToken = TokenGenerator.GenerateToken(user, roles, _configuration);


            var newRefreshToken = TokenGenerator.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); 

            await _userManager.UpdateAsync(user);

            return Ok(new
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            });
        }


    }
}
