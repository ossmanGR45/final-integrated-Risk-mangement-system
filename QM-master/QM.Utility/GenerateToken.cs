using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Configuration;
using QM.Models.DataModels;

namespace QM.Utility
{
    public static class TokenGenerator
    {

        public static string GenerateToken(User user ,string role, IConfiguration config, int expirationMinutes = 60 )
        {
            var keyBytes = Encoding.UTF8.GetBytes(config["Jwt:Key"]);
            var signingKey = new SymmetricSecurityKey(keyBytes);
            var signingCredentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256
            );

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), 
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: config["Jwt:issuer"],
                audience: config["Jwt:audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: signingCredentials
            );

            var tokenHandler = new JwtSecurityTokenHandler();
            return tokenHandler.WriteToken(token);
        }

        // generate token for multiple roles
        public static string GenerateToken(User user, IEnumerable<string> roles, IConfiguration config, int expirationMinutes = 60)
        {
            var keyBytes = Encoding.UTF8.GetBytes(config["Jwt:Key"]);
            var signingKey = new SymmetricSecurityKey(keyBytes);
            var signingCredentials = new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256
            );

            var claims = new List<Claim>
              {
                  new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                  new Claim(ClaimTypes.Email, user.Email)
              };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: config["Jwt:issuer"],
                audience: config["Jwt:audience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: signingCredentials
            );

            var tokenHandler = new JwtSecurityTokenHandler();
            return tokenHandler.WriteToken(token);
        }

        public static string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

    }


}
