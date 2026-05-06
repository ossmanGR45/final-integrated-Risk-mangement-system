using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace QM.Models.DataModels
{
    public class Category : EntityBase
    {
        

        public string? CategoryName { get; set; }
         
        // Navigation Property: One Category has many Risks
    }
}