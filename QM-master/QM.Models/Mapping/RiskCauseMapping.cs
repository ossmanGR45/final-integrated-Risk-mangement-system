using QM.Models.DataModels;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace QM.Models.Mapping
{
    public class RiskCauseMapping : EntityBase
    {
        
        public int RiskID { get; set; }

        public int CauseID { get; set; }

        public bool Custom { get; set; }

        #region single Navigation Property
        [JsonIgnore]
        public Risk Risk { get; set; }
        public Cause Cause { get; set; }
        #endregion

    }
}