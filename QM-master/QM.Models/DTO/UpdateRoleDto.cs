using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QM.Models.DTO
{
    public class UpdateRoleDto
    {
        public string UserName { get; set; }
        public string NewRole { get; set; }
        public int? ManagerId { get; set; } 
    }
}
