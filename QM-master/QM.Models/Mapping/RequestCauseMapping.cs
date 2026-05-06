using QM.Models.DataModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace QM.Models.Mapping
{
    public class RequestCauseMapping : EntityBase
    {
        public int RequestID { get; set; }
        public Request Request { get; set; }
        public int CauseID { get; set; }
        public Cause Cause { get; set; }
    }
}
