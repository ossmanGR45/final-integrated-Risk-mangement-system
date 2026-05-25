using QM.Models.Mapping;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace QM.Models.DataModels
{
    public class Cause : EntityBase
    {
        public string? CauseDescription { get; set; } = null;
        public bool? Custom { get; set; } = null;
        

        // Navigation Properties
      
        [JsonIgnore]
        public ICollection<RiskCauseMapping>? RiskCauses { get; set; } = null;
        public ICollection<ActionCauseMapping>? ActionCauses { get; set; } = null;
        public ICollection<RequestCauseMapping>? RequestCauses { get; set; } = null;
    }
}