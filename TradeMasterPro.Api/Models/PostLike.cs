namespace TradeMasterPro.Api.Models;

// A single like on a post. Unique per (PostId, UserId) — see AppDbContext index.
public class PostLike
{
    public int Id { get; set; }
    public int PostId { get; set; }        // FK -> Posts
    public int UserId { get; set; }        // FK -> Users (who liked)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
