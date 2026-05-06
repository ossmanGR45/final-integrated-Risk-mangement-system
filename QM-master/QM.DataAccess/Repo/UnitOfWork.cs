using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QM.DataAccess.Data;
using QM.DataAccess.Repo.IRepo;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace QM.DataAccess.Repo
{
    public class UnitOfWork : IUnitOfWork
    {

        private readonly ApplicationDbContext context;

        
        

        public UnitOfWork(ApplicationDbContext db)
        {
            context = db;
            
        }



        //public static UnitOfWork GetInstance()
        //{


        //    string connectionString = "Server=localhost\\SQLEXPRESS;Database=QM;Trusted_Connection=true;TrustServerCertificate=true";

            
        //    var options = new DbContextOptionsBuilder<ApplicationDbContext>() 
        //        .UseSqlServer(connectionString)
        //        .Options;

        
        //    var context = new ApplicationDbContext(options);

        //    var unitOfWork = new UnitOfWork(context);



        //    return unitOfWork;
        //}

        public ApplicationDbContext GetContext()
        {
            return context;
        }
        // The "Best Practice" way to get a Generic Repo without hardcoding properties
       

        public async Task<int> SaveChangesAsync()
        {
            return await context.SaveChangesAsync();
        }
    }
}