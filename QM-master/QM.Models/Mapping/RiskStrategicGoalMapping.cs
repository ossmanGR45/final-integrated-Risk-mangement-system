using QM.Models.DataModels;
using System.ComponentModel.DataAnnotations;

namespace QM.Models.Mapping
{
    public class RiskStrategicGoalMapping : EntityBase
    {
       
        public int RiskId { get; set; }
        public Risk Risk { get; set; }

        public bool Custom { get; set; }

        public int StrategicGoalId { get; set; }
        public StrategicGoal StrategicGoal { get; set; }
    }
}