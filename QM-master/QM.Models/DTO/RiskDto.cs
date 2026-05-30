using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using static QM.Models.Enums;

namespace QM.Models.DTO
{
    public class RiskDto
    {
        public int? Id { get; set; }
        public string? Department { get; set; } = null;
        public string? RiskName { get; set; } = null;
        public string? RiskDescription { get; set; } = null;
        public string? Location { get; set; } = null;
        /// <summary>
        /// Accepted as an integer 1–5 from the frontend.
        /// Stored as a decimal midpoint in the database (1→0.10 … 5→0.90).
        /// </summary>
        [JsonConverter(typeof(LikelihoodJsonConverter))]
        public double? likelihood { get; set; } = null;
        public Impact? Impact { get; set; } = null;

        public bool? ReDirected { get; set; } = null;
        public RequestStatus? Status { get; set; } = null;

        // Foreign Key to Category
        public int? UserId { get; set; } = null;
        public string CategoryName { get; set; }

        public int? ResponsibleId { get; set; } = null;

        public List<ActionInputDto>? Actions { get; set; } = new List<ActionInputDto>();
        public List<CauseDto>? Causes { get; set; } = new List<CauseDto>();
        public List<StrategicGoalDto>? StrategicGoals { get; set; } = new List<StrategicGoalDto>();


    }
}
