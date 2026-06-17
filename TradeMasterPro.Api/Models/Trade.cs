namespace TradeMasterPro.Api.Models;

public class Trade
{
    public int Id { get; set; }
    public int StudentId { get; set; }       // Users table
    public int SignalId { get; set; }        // Signals table
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal? Pnl { get; set; }        // profit/loss
    public string Outcome { get; set; } = "Open";   // Win / Loss / Open
    public DateTime? ClosedAt { get; set; }
}
