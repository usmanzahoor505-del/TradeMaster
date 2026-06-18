namespace TradeMasterPro.Api.Models;

// A comment on a post. Nested replies are modelled via ParentCommentId
// (null = top-level comment, set = reply to another comment).
public class PostComment
{
    public int Id { get; set; }
    public int PostId { get; set; }            // FK -> Posts
    public int UserId { get; set; }            // FK -> Users (author)
    public int? ParentCommentId { get; set; }  // FK -> PostComments (null = top-level)
    public string Text { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";   // Active | Removed (moderation)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
