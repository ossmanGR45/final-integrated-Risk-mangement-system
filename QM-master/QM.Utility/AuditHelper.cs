using Microsoft.EntityFrameworkCore.ChangeTracking;
using QM.Models.DataModels;
using System.Text.Json;

public class AuditEntry
{
    public AuditEntry(EntityEntry entry)
    {
        Entry = entry;
    }
    public EntityEntry Entry { get; }
    public int UserId { get; set; }
    public string TableName { get; set; }
    public int? PrimaryKeyId { get; set; }
    public Dictionary<string, object> KeyValues { get; } = new();
    public Dictionary<string, object> OldValues { get; } = new();
    public Dictionary<string, object> NewValues { get; } = new();
    public string AuditType { get; set; }
    public List<string> ChangedColumns { get; } = new();

    public AuditLog ToAudit()
    {
        var audit = new AuditLog();
        audit.UserId = UserId;
        audit.Type = AuditType;
        audit.TableName = TableName;
        audit.DateTime = DateTime.UtcNow;
        audit.PrimaryKey = PrimaryKeyId;
        audit.OldValues = OldValues.Count == 0 ? null : JsonSerializer.Serialize(OldValues);
        audit.NewValues = NewValues.Count == 0 ? null : JsonSerializer.Serialize(NewValues);
        audit.AffectedColumns = ChangedColumns.Count == 0 ? null : JsonSerializer.Serialize(ChangedColumns);
        return audit;
    }
}