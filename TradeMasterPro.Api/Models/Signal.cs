namespace TradeMasterPro.Api.Models;

public class Signal
{
    public int Id { get; set; }

    public int TeacherId { get; set; }          // kis teacher ne banaya (Users table se link)

    public string Pair { get; set; } = string.Empty;   // jaise BTC/USDT
    public string Action { get; set; } = string.Empty;  // BUY / SELL

    public decimal EntryLow { get; set; }        // Entry zone start
    public decimal EntryHigh { get; set; }       // Entry zone end

    public decimal Tp1 { get; set; }             // Take Profit 1
    public decimal? Tp2 { get; set; }            // Take Profit 2 (optional)
    public decimal Sl { get; set; }              // Stop Loss

    public string Leverage { get; set; } = string.Empty;   // jaise "5x"
    public string RiskLevel { get; set; } = "LOW";          // LOW / MEDIUM / HIGH
    public string Status { get; set; } = "Active";          // Active / Closed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
