namespace TradeMasterPro.Api.Models;

public class Plan
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;     // Basic/Silver/Gold/Platinum
    public decimal PriceUsd { get; set; }                 // 0 / 9.99 / 24.99 / 49.99
    public string FeaturesJson { get; set; } = "{}";      // features ki list (JSON)
    public decimal CommissionRate { get; set; }           // teacher ka share %
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
