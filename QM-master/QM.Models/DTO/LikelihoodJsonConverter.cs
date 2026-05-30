using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace QM.Models.DTO
{
    public class LikelihoodJsonConverter : JsonConverter<double?>
    {
        public override double? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.Number)
            {
                return reader.GetDouble();
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                string? str = reader.GetString();
                if (double.TryParse(str, out double val))
                {
                    return val;
                }
            }

            return null;
        }

        public override void Write(Utf8JsonWriter writer, double? value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
            }
            else
            {
                int displayInt = ConvertLikelihoodToDisplayInt(value.Value);
                writer.WriteNumberValue(displayInt);
            }
        }

        public static int ConvertLikelihoodToDisplayInt(double value)
        {
            // If it's a legacy or pre-existing integer display value (1 to 5)
            if (value == 1.0) return 1;
            if (value == 2.0) return 2;
            if (value == 3.0) return 3;
            if (value == 4.0) return 4;
            if (value == 5.0) return 5;

            // Mapping based on closeness to 0.10, 0.30, 0.50, 0.70, 0.90:
            // [0.00, 0.20) -> 1
            // [0.20, 0.40) -> 2
            // [0.40, 0.60) -> 3
            // [0.60, 0.80) -> 4
            // [0.80, 1.00] -> 5
            if (value < 0.20) return 1;
            if (value < 0.40) return 2;
            if (value < 0.60) return 3;
            if (value < 0.80) return 4;
            return 5;
        }
    }
}
