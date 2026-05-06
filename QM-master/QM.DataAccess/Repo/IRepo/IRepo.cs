using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace QM.DataAccess.Repo.IRepo
{
    public interface IRepo<T> where T : class
    {
        public Task<T> GetByIdAsync(int id,List<string>include);
        public Task<List<T>> FindAllAsync(Expression<Func<T, bool>>? filter = null, string? orderBy = null, Pagger? pagger = null, List<string>? include = null);
        public Task<T> AddUpdateAsync(T entity);

        public Task AddUpdateAsync(IEnumerable<T> entities);
        
        public Task DeleteAsync(T entity);
    }
}