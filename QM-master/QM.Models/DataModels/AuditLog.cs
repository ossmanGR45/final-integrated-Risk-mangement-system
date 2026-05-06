public class AuditLog : EntityBase
{
    public int UserId { get; set; } // The ID of the user performing the action
    public string? Type { get; set; }   // Create, Update, or Delete
    public string? TableName { get; set; }
    public DateTime DateTime { get; set; }
    public string? OldValues { get; set; } // JSON format
    public string? NewValues { get; set; } // JSON format
    public string? AffectedColumns { get; set; }
    public int? PrimaryKey { get; set; }
}