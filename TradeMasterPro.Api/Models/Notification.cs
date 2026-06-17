namespace TradeMasterPro.Api.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }          // Users table
    public int? SignalId { get; set; }       // Signals table (optional)
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime? ReadAt { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
