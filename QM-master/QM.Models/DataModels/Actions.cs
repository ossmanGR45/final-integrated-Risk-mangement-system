using QM.Models.Mapping;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static QM.Models.Enums;

namespace QM.Models.DataModels
{
    public class Actions : EntityBase
    {
        public string? ActionDescription { get; set; } = null;
        public ActionType? ActionType { get; set; } = null;
        public bool? Custom { get; set; } = null;
        

        // Navigation Properties
       
        public ICollection<RiskActionMapping>? RiskActions { get; set; } = null;
        public ICollection<ActionCauseMapping>? ActionCauses { get; set; } = null;
        public ICollection<RequestActionMapping>? RequestActions { get; set; } = null;
        
        
    }
}