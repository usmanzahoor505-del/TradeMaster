namespace TradeMasterPro.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;   // naya — hashed password
    public string Role { get; set; } = "Student";   // Teacher / Student / Admin
    public string Tier { get; set; } = "Free";       // Free / Pro (teachers ke liye)
    public string Status { get; set; } = "Active";    // Active / Suspended / Banned
    public string? FcmToken { get; set; }             // Firebase Cloud Messaging Token
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
