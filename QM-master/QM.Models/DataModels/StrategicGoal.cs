using QM.Models.Mapping;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace QM.Models.DataModels
{
    public class StrategicGoal : EntityBase
    {
        

        public string? GoalDescription { get; set; }


        // Navigation Property
        [JsonIgnore]
        public ICollection<RiskStrategicGoalMapping>? RiskGoals { get; set; }
        public ICollection<RequestStrategicGoalMapping>? RequestGoals { get; set; }
    }
}