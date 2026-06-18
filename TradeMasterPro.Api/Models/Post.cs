using System;
using System.Collections.Generic;

namespace TradeMasterPro.Api.Models;

public class Post
{
    public int Id { get; set; }
    public int UserId { get; set; }                       // author (Teacher) -> Users
    public string UserName { get; set; } = string.Empty;  // denormalised for fast feed reads
    public string UserAvatar { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Image { get; set; }

    // General | MarketAnalysis | TradingInsight | Educational
    public string PostType { get; set; } = "General";

    // Cached interaction counters (kept in sync with PostLikes/PostComments/PostShares).
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }

    public string Status { get; set; } = "Published";     // Published | Removed (moderation)

    // ── Legacy columns (kept for backward compatibility, no longer written) ──
    public List<int> LikedByIds { get; set; } = new List<int>();
    public string CommentsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
