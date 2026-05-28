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
        /// <summary>
        /// Stores the raw decimal probability (e.g. 0.28) directly.
        /// The EWMA calculation reads and writes this value each year.
        /// When the frontend requests it, the API maps it to display integer 1–5.
        /// Mapping: [0, 0.20)→1  [0.20, 0.40)→2  [0.40, 0.60)→3  [0.60, 0.80)→4  [0.80, 1]→5
        /// </summary>
        public double? likelihood { get; set; } = null;

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


