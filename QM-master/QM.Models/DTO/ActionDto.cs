using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static QM.Models.Enums;

namespace QM.Models.DTO
{
    public class ActionInputDto
    {

        public int? Id { get; set; } 

        public string? ActionDescription { get; set; }

        public ActionType? ActionType { get; set; }

        public bool? Custom { get; set; }
    }
}
