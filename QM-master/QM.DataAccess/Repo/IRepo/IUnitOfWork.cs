using QM.DataAccess.Data;
using System;
using System.Threading.Tasks;

namespace QM.DataAccess.Repo.IRepo
{
    public interface IUnitOfWork 
    {

        ApplicationDbContext GetContext();

        Task<int> SaveChangesAsync();
    }
}