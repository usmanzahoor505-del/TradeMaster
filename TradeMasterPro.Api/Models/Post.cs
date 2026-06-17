using System;
using System.Collections.Generic;

namespace TradeMasterPro.Api.Models;

public class Post
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserAvatar { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Image { get; set; }
    public int LikesCount { get; set; }
    public List<int> LikedByIds { get; set; } = new List<int>();
    public string CommentsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
