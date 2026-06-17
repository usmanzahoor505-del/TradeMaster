namespace TradeMasterPro.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }          // Users table
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Type { get; set; } = "credit";   // credit / debit
    public string Status { get; set; } = "Pending"; // Pending/Completed/Failed
    public string Gateway { get; set; } = string.Empty;  // Stripe/JazzCash/EasyPaisa
    public string? GatewayRef { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
