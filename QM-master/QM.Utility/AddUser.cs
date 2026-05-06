//using System;
//using System.Threading.Tasks;
//using Microsoft.AspNetCore.Identity;
//using QM.Models.DataModels;

//namespace QM.Utility
//{
//    public static class AddUser
//    {
//        /// <summary>
//        /// Creates a new user (by email) with the specified password and optionally assigns a role.
//        /// Returns the IdentityResult from the create/add-to-role operations.
//        /// </summary>
//        public static async Task<IdentityResult> CreateAsync(
//            UserManager<User> userManager,
//            string email,
//            string password,
//            string? roleName = null)
//        {
//            if (userManager is null)
//                throw new ArgumentNullException(nameof(userManager));

//            if (string.IsNullOrWhiteSpace(email))
//                throw new ArgumentException("Email must be provided.", nameof(email));

//            if (string.IsNullOrEmpty(password))
//                throw new ArgumentException("Password must be provided.", nameof(password));

//            // If a user with this email already exists, return a failed IdentityResult.
//            var existing = await userManager.FindByEmailAsync(email);
//            if (existing != null)
//            {
//                return IdentityResult.Failed(new IdentityError
//                {
//                    Code = "UserAlreadyExists",
//                    Description = "A user with this email already exists."
//                });
//            }

//            var user = new User
//            {
//                UserName = email,
//                Email = email,
//                EmailConfirmed = true
//            };

//            var createResult = await userManager.CreateAsync(user, password);
//            if (!createResult.Succeeded)
//            {
//                return createResult;
//            }

//            if (!string.IsNullOrWhiteSpace(roleName))
//            {
//                var roleResult = await userManager.AddToRoleAsync(user, roleName);
//                if (!roleResult.Succeeded)
//                {
//                    return roleResult;
//                }
//            }

//            return IdentityResult.Success;
//        }
//    }
//}