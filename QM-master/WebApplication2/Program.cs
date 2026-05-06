using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Data;

using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using QM.Models.DataModels;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<ApplicationDbContext>(options =>options.UseSqlServer( builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

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

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });



// Add this line!
builder.Services.AddHttpContextAccessor();



var app = builder.Build();




// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
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
    var userManager = services.GetRequiredService<UserManager<User>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole<int>>>();

    var email = "mohammedarqan@gmail.com";
    var password = "Mohammed@12345"; // Ensure this meets complexity requirements
    var roleName = "Admin";

    var email2 = "Othman@gmail.com";
    var roleName2 = "Risk Manager";

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
            UserName = email2,
            Email = email2,
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
            UserName = email3,
            Email = email3,
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



