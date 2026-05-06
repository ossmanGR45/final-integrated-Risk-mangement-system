using Microsoft.AspNetCore.Mvc;
using QM.DataAccess.Data;
using QM.DataAccess.Repo;
using QM.DataAccess.Repo.IRepo;

namespace QM.Controller
{
    public class BaseController : ControllerBase
    {
        
        protected readonly IUnitOfWork _uow;   
        protected readonly ApplicationDbContext _context;
        public BaseController(IUnitOfWork uow)
        {
            _uow = uow;
            _context = uow.GetContext();
        }
    }
}
