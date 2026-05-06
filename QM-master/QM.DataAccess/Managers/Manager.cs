using Microsoft.EntityFrameworkCore;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace QM.DataAccess.Managers
{
    public class Manager<T> where T : EntityBase
    {
        protected Repo<T> Repo;

        public UnitOfWork UnitOfWork;

        public Manager(IUnitOfWork uow) 
        { 


            Repo = new Repo<T>(uow);
     
        }


        public async Task<List<T>> FindAllAsync(Expression<Func<T, bool>>? filter = null, string? orderBy = null, Pagger? paggerBy = null, List<String>? include = null)
        {
            
            
            return await Repo.FindAllAsync(filter,orderBy,paggerBy,include);


        }

        public async Task<T?> GetByIdAsync(int id,List<string>? include= null)
        {
            return await Repo.GetByIdAsync(id,include);
        }

        public async Task<T> AddUpdateAsync(T entity)
        {
            return await Repo.AddUpdateAsync(entity);
        }

        public async Task AddUpdateAsync(IEnumerable<T> entities)
        {
            await Repo.AddUpdateAsync(entities);
        }

        public async Task DeleteAsync(T entity)
        {
            await Repo.DeleteAsync(entity);
        }

        


    }
}
