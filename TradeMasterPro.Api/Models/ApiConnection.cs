namespace TradeMasterPro.Api.Models;

public class ApiConnection
{
    public int Id { get; set; }
    public int StudentId { get; set; }       // Users table
    public string Exchange { get; set; } = string.Empty;  // Binance/Bybit
    public string EncryptedApiKey { get; set; } = string.Empty;
    public string EncryptedSecret { get; set; } = string.Empty;
    public string Permissions { get; set; } = "trade";    // sirf trade, withdrawal nahi
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
