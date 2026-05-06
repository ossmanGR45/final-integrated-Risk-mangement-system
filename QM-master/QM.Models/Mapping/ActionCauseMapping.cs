using QM.Models.DataModels;
using System.ComponentModel.DataAnnotations;

namespace QM.Models.Mapping
{
    public class ActionCauseMapping : EntityBase
    {
        
        public int ActionID { get; set; }

        public int CauseID { get; set; }
        

        #region single Navigation Property
        public Actions Action { get; set; }
        public Cause Cause { get; set; }

        #endregion
    }
}