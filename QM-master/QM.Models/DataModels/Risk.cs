using QM.Models.Mapping;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using static QM.Models.Enums;

namespace QM.Models.DataModels
{
    public class Risk : EntityBase
    {
        public string? Department { get; set; } = null;
        public string? RiskName { get; set; } = null;
        public string? RiskDescription { get; set; } = null;
        public string? Location { get; set; } = null;
        public Likelihood? likelihood { get; set; } = null;
        public Impact? Impact { get; set; } = null;
        public bool? Custom { get; set; } = null;
        public bool? ReDirected { get; set; } = null;
        public RequestStatus? Status { get; set; } = null;

        // Foreign Key to Category
        public int? UserId { get; set; } = null;
        public string CategoryName { get; set; }

        public int? ResponsibleId { get; set; } = null;

        // Navigation Properties
        public User? User { get; set; } = null;
        public Responsible? Responsible { get; set; } = null;
        public ICollection<RiskCauseMapping>? RiskCauses { get; set; } = null;
        public ICollection<RiskActionMapping>? RiskActions { get; set; } = null;
        public ICollection<RiskStrategicGoalMapping>? RiskGoals { get; set; } = null;
        public ICollection<Request>? Requests { get; set; } = null;
    }
}


