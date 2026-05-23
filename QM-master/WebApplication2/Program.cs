using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QM.DataAccess.Data;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using QM.Middleware;
using QM.Models.DataModels;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// Allow each developer to override settings locally without touching shared files.
// Create an "appsettings.Local.json" (git-ignored) with your machine-specific config.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<ApplicationDbContext>(options =>options.UseSqlServer( builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
   
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Remove the default UserValidator that enforces unique usernames
var defaultValidator = builder.Services
    .Where(s => s.ServiceType == typeof(IUserValidator<User>))
    .ToList();
foreach (var validator in defaultValidator)
{
    builder.Services.Remove(validator);
}
// Add our custom validator that allows duplicate usernames
builder.Services.AddTransient<IUserValidator<User>, OptionalUniqueUserNameValidator>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience= true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddAuthorization();

builder.Services.AddControllers(options =>
    {
        // Register the centralized validation filter on all controllers.
        options.Filters.Add<ValidationFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Disable the default automatic 400 response so our ValidationFilter handles it.
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});



// Add this line!
builder.Services.AddHttpContextAccessor();



var app = builder.Build();


// Centralized error handling — catches ALL unhandled exceptions and returns
// a consistent ApiErrorResponse JSON envelope. Must be registered first so
// it wraps the entire pipeline.
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

// app.UseHttpsRedirection(); // Disabled for Docker (container runs HTTP on port 8080)
app.UseRouting();

app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{area=initi}/{controller=Form}/{action=Index}/{id?}")
    .WithStaticAssets();


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    
    // Ensure the database is created and all migrations are applied
    var context = services.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate();

    var userManager = services.GetRequiredService<UserManager<User>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();

    
    var email = "mohammedarqan@gmail.com";
    var password = "Mohammed@12345"; // Ensure this meets complexity requirements
    var roleName = "Admin";

    var email2 = "Othman@gmail.com";
    var roleName2 = "Manager";

    var email3 = "Omar@gmail.com";
    var roleName3 = "Initi";

    if (!await roleManager.RoleExistsAsync(roleName))
    {
        await roleManager.CreateAsync(new IdentityRole<int>(roleName));
    }
    if (!await roleManager.RoleExistsAsync(roleName2))
    {
        await roleManager.CreateAsync(new IdentityRole<int>(roleName2));
    }
    if (!await roleManager.RoleExistsAsync(roleName3))
    {
        await roleManager.CreateAsync(new IdentityRole<int>(roleName3));
    }
    // 2. Create the User
    var Admin = await userManager.FindByEmailAsync(email);
    var Manager = await userManager.FindByEmailAsync(email2);
    var Initi = await userManager.FindByEmailAsync(email3);

    if (Admin == null)
    {
        Admin = new User
        {
            Id = 100000, 
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(Admin, password);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(Admin, roleName);
        }
    }
    if (Manager == null)
    {
        Manager = new User
        {
            Id = 100001, 
            UserName = email2,
            Email = email2,
            ManagerId = 100000,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(Manager, password);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(Manager, roleName2);
        }
    }
    if (Initi == null)
    {
        Initi = new User
        {
            Id = 100002,
            UserName = email3,
            Email = email3,
            ManagerId = 100001,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(Initi, password);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(Initi, roleName3);
        }
    }

}

app.Run();



