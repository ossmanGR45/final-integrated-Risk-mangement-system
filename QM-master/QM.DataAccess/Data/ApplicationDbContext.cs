using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using QM.Models.DataModels;
using QM.Models.Mapping;
using System.Security.Claims; 
using Microsoft.AspNetCore.Http;

namespace QM.DataAccess.Data
{
    public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<AuditLog> AuditLogs { get; set; } 
        public DbSet<Risk> Risks { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<StrategicGoal> StrategicGoals { get; set; }
        public DbSet<Actions> Actions { get; set; }
        public DbSet<Cause> Causes { get; set; }
        public DbSet<Responsible> Responsible { get; set; }
        public DbSet<Request> RiskRequests { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<NotificationModel> Notifications { get; set; }



        public DbSet<RiskCauseMapping> RiskCauseMappings { get; set; }
        public DbSet<ActionCauseMapping> ActionCauseMappings { get; set; }
        public DbSet<RiskActionMapping> RiskActionMappings { get; set; }
        public DbSet<RiskStrategicGoalMapping> RiskGoalMappings { get; set; }
        public DbSet<RequestActionMapping> RequestActionMappings { get; set; }
        public DbSet<RequestCauseMapping> RequestCauseMappings { get; set; }
        


        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            
            int userId = int.Parse(_httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");


            var auditEntries = OnBeforeSaveChanges(userId);


            var result = await base.SaveChangesAsync(cancellationToken);

            await OnAfterSaveChanges(auditEntries);

            return result;
        }

        private List<AuditEntry> OnBeforeSaveChanges(int userId)
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry)
                {
                    TableName = entry.Entity.GetType().Name,
                    UserId = userId
                };
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.AuditType = "Create";
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            break;

                        case EntityState.Deleted:
                            auditEntry.AuditType = "Delete";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.ChangedColumns.Add(propertyName);
                                auditEntry.AuditType = "Update";
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                            }
                            break;
                    }
                }
            }
            return auditEntries;
        }

        private Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
        {
            if (auditEntries == null || auditEntries.Count == 0) return Task.CompletedTask;

            foreach (var entry in auditEntries)
            {

                foreach (var prop in entry.Entry.Properties)
                {
                    if (prop.Metadata.IsPrimaryKey())
                    {
                        if (prop.CurrentValue != null && int.TryParse(prop.CurrentValue.ToString(), out int id))
                        {
                            entry.PrimaryKeyId = id;
                        }
                    }
                }
                AuditLogs.Add(entry.ToAudit());
            }
            return base.SaveChangesAsync();
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            SeedRoles(builder);
        }

        private void SeedRoles(ModelBuilder builder)
        {
            builder.Entity<IdentityRole<int>>().HasData(
                new IdentityRole<int> { Id = 1, Name = "Initi", NormalizedName = "INITI" },
                new IdentityRole<int> { Id = 2, Name = "Risk Manager", NormalizedName = "RISK MANAGER" },
                new IdentityRole<int> { Id = 3, Name = "Admin", NormalizedName = "ADMIN" }
            );
        }
    }
}

       