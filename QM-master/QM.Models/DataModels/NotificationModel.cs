using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static QM.Models.Enums;

namespace QM.Models.DataModels
{
    public class NotificationModel : EntityBase
    {
        public int requestId { get; set; }
        public notificationType? status { get; set; } = null;
        public requestType requestType { get; set; }
        public DateTime createdAt { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}





