using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace QM.Models.DTO
{
    /// <summary>
    /// DTO used for both Risk and Request cause inputs. Standardized field name
    /// to match the underlying entity property (Cause.CauseDescription).
    /// We keep "description" as a JSON-aliased fallback so older clients that
    /// still send "description" continue to work.
    /// </summary>
    public class CauseDto
    {
        public int? Id { get; set; }

        public string? CauseDescription { get; set; } = null;

        // Backward-compat alias: older clients may send "description".
        [JsonPropertyName("description")]
        public string? Description
        {
            get => CauseDescription;
            set
            {
                if (string.IsNullOrEmpty(CauseDescription) && !string.IsNullOrEmpty(value))
                {
                    CauseDescription = value;
                }
            }
        }

        public bool? Custom { get; set; } = null;
    }
}
