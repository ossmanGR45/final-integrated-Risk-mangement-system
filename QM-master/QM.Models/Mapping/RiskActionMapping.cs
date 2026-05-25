using QM.Models.DataModels;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace QM.Models.Mapping
{
    public class RiskActionMapping : EntityBase
    {
        
        public int RiskID { get; set; }

        public int ActionID { get; set; }

        public bool Custom { get; set; }

        #region single Navigation Property
        [JsonIgnore]
        public Risk Risk { get; set; }

        public Actions Action { get; set; }


        #endregion
    }
}