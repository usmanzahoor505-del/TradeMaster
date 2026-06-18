namespace TradeMasterPro.Api.Models;

public class Dispute
{
    public int Id { get; set; }
    public int RaisedById { get; set; }            // user who filed the dispute
    public int? AgainstId { get; set; }            // the other party (teacher/student), optional
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Open";    // Open / Resolved / Rejected
    public string? Resolution { get; set; }          // admin's resolution note
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
