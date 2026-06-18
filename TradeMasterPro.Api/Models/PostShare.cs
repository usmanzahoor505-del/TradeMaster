namespace TradeMasterPro.Api.Models;

// A share/repost action. Tracked per user so share counts are accurate and a
// future deep-link target can be attached.
public class PostShare
{
    public int Id { get; set; }
    public int PostId { get; set; }        // FK -> Posts
    public int UserId { get; set; }        // FK -> Users (who shared)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
