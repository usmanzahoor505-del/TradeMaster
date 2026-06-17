namespace TradeMasterPro.Api.Models;

public class Subscription
{
    public int Id { get; set; }
    public int StudentId { get; set; }       // Users table
    public int TeacherId { get; set; }       // Users table
    public int PlanId { get; set; }          // Plans table
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = "Active";   // Active / Expired / Cancelled
    public string? PaymentRef { get; set; }
}
