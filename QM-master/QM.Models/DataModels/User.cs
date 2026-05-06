using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QM.Models.DataModels
{
    public class User : IdentityUser<int>
    {

        
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public int? ManagerId { get; set; } 
        
        public ICollection<Risk>? risk { get; set; }
        public ICollection<Request>? request { get; set; }
        public ICollection<NotificationModel>? notifications { get; set; }

    }
}
