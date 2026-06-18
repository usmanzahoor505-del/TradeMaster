using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : BaseApiController
{
    private readonly AppDbContext _db;

    private const int MaxPageSize = 50;
    private static readonly string[] AllowedTypes = { "General", "MarketAnalysis", "TradingInsight", "Educational" };

    public PostsController(AppDbContext db)
    {
        _db = db;
    }

    // ─── Reads ──────────────────────────────────────────────────────────────

    // GET /api/posts/home-feed  — latest 3 published posts for the home screen
    [HttpGet("home-feed")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHomeFeed()
    {
        var posts = await _db.Posts
            .Where(p => p.Status == "Published")
            .OrderByDescending(p => p.CreatedAt)
            .Take(3)
            .ToListAsync();

        return Ok(await BuildPostDtosAsync(posts));
    }

    // GET /api/posts/explore?page=1&pageSize=10&search=  — paginated, newest first
    [HttpGet("explore")]
    [AllowAnonymous]
    public async Task<IActionResult> GetExplore([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = _db.Posts.Where(p => p.Status == "Published");
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(p => EF.Functions.ILike(p.Content, $"%{term}%"));
        }

        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(Paged(await BuildPostDtosAsync(posts), page, pageSize, total));
    }

    // GET /api/posts/teacher/5?page=1&pageSize=10  — a teacher's posts, paginated
    [HttpGet("teacher/{teacherId:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTeacherPosts(int teacherId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        (page, pageSize) = NormalizePaging(page, pageSize);

        var query = _db.Posts.Where(p => p.UserId == teacherId && p.Status == "Published");
        var total = await query.CountAsync();
        var posts = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(Paged(await BuildPostDtosAsync(posts), page, pageSize, total));
    }

    // GET /api/posts/5  — single post details + nested comments
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == id && p.Status != "Removed");
        if (post == null) return NotFound(new { message = "Post not found" });

        var dto = (await BuildPostDtosAsync(new List<Post> { post })).First();

        var comments = await _db.PostComments
            .Where(c => c.PostId == id && c.Status == "Active")
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var userIds = comments.Select(c => c.UserId).Distinct().ToList();
        var names = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name })
            .ToDictionaryAsync(u => u.Id, u => u.Name);

        return Ok(new PostDetailsDto
        {
            Post = dto,
            Comments = BuildCommentTree(comments, names)
        });
    }

    // GET /api/posts  — backward-compatible list (published only)
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _db.Posts
            .Where(p => p.Status == "Published")
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(await BuildPostDtosAsync(posts));
    }

    // ─── Create / Update / Delete ───────────────────────────────────────────

    // POST /api/posts  — only Teachers (or Admin) may publish
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Create([FromBody] PostCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "Post content is required" });

        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        var post = new Post
        {
            UserId = user.Id,
            UserName = user.Name,
            UserAvatar = user.Name.Substring(0, Math.Min(2, user.Name.Length)).ToUpper(),
            Content = req.Content.Trim(),
            Image = req.Image,
            PostType = AllowedTypes.Contains(req.PostType) ? req.PostType : "General",
            Status = "Published",
            CreatedAt = DateTime.UtcNow
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        // Notify the teacher's active subscribers (reuses the Notification system).
        var subscriberIds = await _db.Subscriptions
            .Where(s => s.TeacherId == user.Id && s.Status == "Active")
            .Select(s => s.StudentId)
            .Distinct()
            .ToListAsync();
        foreach (var sid in subscriberIds)
            AddNotification(sid, "New Post", $"{user.Name} shared a new post.", post.Id);
        if (subscriberIds.Count > 0)
            await _db.SaveChangesAsync();

        return Ok((await BuildPostDtosAsync(new List<Post> { post })).First());
    }

    // PUT /api/posts/5  — author or Admin
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] PostUpdateDto req)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Post not found" });

        if (post.UserId != CurrentUserId && !IsAdmin)
            return Forbid();

        if (!string.IsNullOrWhiteSpace(req.Content)) post.Content = req.Content.Trim();
        if (req.Image != null) post.Image = req.Image;
        if (!string.IsNullOrWhiteSpace(req.PostType) && AllowedTypes.Contains(req.PostType)) post.PostType = req.PostType;
        post.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok((await BuildPostDtosAsync(new List<Post> { post })).First());
    }

    // DELETE /api/posts/5  — author or Admin (soft-delete for moderation/audit)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Post not found" });

        if (post.UserId != CurrentUserId && !IsAdmin)
            return Forbid();

        post.Status = "Removed";
        post.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Post removed successfully" });
    }

    // ─── Interactions ───────────────────────────────────────────────────────

    // POST /api/posts/5/like  — toggle like
    [HttpPost("{id:int}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == id && p.Status == "Published");
        if (post == null) return NotFound(new { message = "Post not found" });

        var existing = await _db.PostLikes.FirstOrDefaultAsync(l => l.PostId == id && l.UserId == CurrentUserId);
        bool liked;
        if (existing != null)
        {
            _db.PostLikes.Remove(existing);
            post.LikesCount = Math.Max(0, post.LikesCount - 1);
            liked = false;
        }
        else
        {
            _db.PostLikes.Add(new PostLike { PostId = id, UserId = CurrentUserId });
            post.LikesCount += 1;
            liked = true;
            await NotifyActorAsync(post.UserId, "{0} liked your post.");
        }

        await _db.SaveChangesAsync();
        return Ok(new { postId = id, liked, likesCount = post.LikesCount });
    }

    // POST /api/posts/5/comment  — add a comment (optionally a reply via ParentCommentId)
    [HttpPost("{id:int}/comment")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CommentCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Text))
            return BadRequest(new { message = "Comment text is required" });

        var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == id && p.Status == "Published");
        if (post == null) return NotFound(new { message = "Post not found" });

        int? parentId = null;
        int notifyRecipient = post.UserId;
        string template = "{0} commented on your post.";

        if (req.ParentCommentId.HasValue)
        {
            var parent = await _db.PostComments.FirstOrDefaultAsync(c => c.Id == req.ParentCommentId.Value && c.PostId == id);
            if (parent == null) return BadRequest(new { message = "Parent comment not found" });
            parentId = parent.Id;
            notifyRecipient = parent.UserId;
            template = "{0} replied to your comment.";
        }

        var comment = new PostComment
        {
            PostId = id,
            UserId = CurrentUserId,
            ParentCommentId = parentId,
            Text = req.Text.Trim(),
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _db.PostComments.Add(comment);
        post.CommentsCount += 1;

        await NotifyActorAsync(notifyRecipient, template);
        await _db.SaveChangesAsync();

        return Ok(await BuildCommentDtoAsync(comment));
    }

    // POST /api/posts/comments/9/reply  — reply to a specific comment (nested)
    [HttpPost("comments/{commentId:int}/reply")]
    public async Task<IActionResult> Reply(int commentId, [FromBody] CommentCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Text))
            return BadRequest(new { message = "Reply text is required" });

        var parent = await _db.PostComments.FindAsync(commentId);
        if (parent == null) return NotFound(new { message = "Comment not found" });

        var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == parent.PostId && p.Status == "Published");
        if (post == null) return NotFound(new { message = "Post not found" });

        var reply = new PostComment
        {
            PostId = parent.PostId,
            UserId = CurrentUserId,
            ParentCommentId = parent.Id,
            Text = req.Text.Trim(),
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        _db.PostComments.Add(reply);
        post.CommentsCount += 1;

        await NotifyActorAsync(parent.UserId, "{0} replied to your comment.");
        await _db.SaveChangesAsync();

        return Ok(await BuildCommentDtoAsync(reply));
    }

    // POST /api/posts/5/share  — track a share
    [HttpPost("{id:int}/share")]
    public async Task<IActionResult> Share(int id)
    {
        var post = await _db.Posts.FirstOrDefaultAsync(p => p.Id == id && p.Status == "Published");
        if (post == null) return NotFound(new { message = "Post not found" });

        _db.PostShares.Add(new PostShare { PostId = id, UserId = CurrentUserId });
        post.SharesCount += 1;

        await NotifyActorAsync(post.UserId, "{0} shared your post.");
        await _db.SaveChangesAsync();

        // deepLink is a stable target for future client-side deep-link handling.
        return Ok(new { postId = id, sharesCount = post.SharesCount, deepLink = $"/posts/{id}" });
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    // Builds post DTOs for a list in a fixed number of queries (no N+1):
    //  1 query for the current user's likes, 1 query for author info.
    private async Task<List<PostResponseDto>> BuildPostDtosAsync(List<Post> posts)
    {
        if (posts.Count == 0) return new List<PostResponseDto>();

        var postIds = posts.Select(p => p.Id).ToList();
        var authorIds = posts.Select(p => p.UserId).Distinct().ToList();

        var likedPostIds = CurrentUserId > 0
            ? (await _db.PostLikes
                .Where(l => l.UserId == CurrentUserId && postIds.Contains(l.PostId))
                .Select(l => l.PostId)
                .ToListAsync()).ToHashSet()
            : new HashSet<int>();

        var authors = await _db.Users
            .Where(u => authorIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name, u.Tier, u.IsFeatured })
            .ToListAsync();
        var authorMap = authors.ToDictionary(a => a.Id);

        return posts.Select(p =>
        {
            authorMap.TryGetValue(p.UserId, out var a);
            return new PostResponseDto
            {
                Id = p.Id,
                UserId = p.UserId,
                TeacherName = a?.Name ?? p.UserName,
                TeacherAvatar = p.UserAvatar,
                TeacherTier = a?.Tier ?? "Free",
                IsFeatured = a?.IsFeatured ?? false,
                Content = p.Content,
                Image = p.Image,
                PostType = p.PostType,
                LikesCount = p.LikesCount,
                CommentsCount = p.CommentsCount,
                SharesCount = p.SharesCount,
                IsLikedByCurrentUser = likedPostIds.Contains(p.Id),
                Status = p.Status,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            };
        }).ToList();
    }

    private async Task<CommentResponseDto> BuildCommentDtoAsync(PostComment c)
    {
        var name = await _db.Users.Where(u => u.Id == c.UserId).Select(u => u.Name).FirstOrDefaultAsync();
        return new CommentResponseDto
        {
            Id = c.Id,
            PostId = c.PostId,
            UserId = c.UserId,
            UserName = name ?? "User",
            Text = c.Text,
            ParentCommentId = c.ParentCommentId,
            CreatedAt = c.CreatedAt,
            Replies = new List<CommentResponseDto>()
        };
    }

    private static List<CommentResponseDto> BuildCommentTree(List<PostComment> comments, Dictionary<int, string> names)
    {
        var map = comments.ToDictionary(c => c.Id, c => new CommentResponseDto
        {
            Id = c.Id,
            PostId = c.PostId,
            UserId = c.UserId,
            UserName = names.TryGetValue(c.UserId, out var n) ? n : "User",
            Text = c.Text,
            ParentCommentId = c.ParentCommentId,
            CreatedAt = c.CreatedAt,
            Replies = new List<CommentResponseDto>()
        });

        var roots = new List<CommentResponseDto>();
        foreach (var c in comments)
        {
            var dto = map[c.Id];
            if (c.ParentCommentId.HasValue && map.TryGetValue(c.ParentCommentId.Value, out var parent))
                parent.Replies.Add(dto);
            else
                roots.Add(dto);
        }
        return roots;
    }

    // Adds a notification for the recipient, looking up the actor's name.
    private async Task NotifyActorAsync(int recipientId, string template)
    {
        if (recipientId <= 0 || recipientId == CurrentUserId) return;
        var actorName = await _db.Users.Where(u => u.Id == CurrentUserId).Select(u => u.Name).FirstOrDefaultAsync() ?? "Someone";
        AddNotification(recipientId, "Post Activity", string.Format(template, actorName), null);
    }

    private void AddNotification(int userId, string title, string message, int? signalId)
    {
        if (userId <= 0 || userId == CurrentUserId) return;
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            SignalId = signalId, // reused field; null for non-signal notifications
            Title = title,
            Message = message,
            SentAt = DateTime.UtcNow
        });
    }

    private static (int page, int pageSize) NormalizePaging(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;
        return (page, pageSize);
    }

    private static PagedResult<T> Paged<T>(List<T> items, int page, int pageSize, int total) => new()
    {
        Items = items,
        Page = page,
        PageSize = pageSize,
        TotalCount = total,
        HasMore = page * pageSize < total
    };
}

// ─── DTOs ───────────────────────────────────────────────────────────────────

public class PostCreateDto
{
    public string Content { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string PostType { get; set; } = "General";
}

public class PostUpdateDto
{
    public string? Content { get; set; }
    public string? Image { get; set; }
    public string? PostType { get; set; }
}

public class CommentCreateDto
{
    public string Text { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }
}

public class PostResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string TeacherAvatar { get; set; } = string.Empty;
    public string TeacherTier { get; set; } = "Free";
    public bool IsFeatured { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string PostType { get; set; } = "General";
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public string Status { get; set; } = "Published";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CommentResponseDto
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CommentResponseDto> Replies { get; set; } = new();
}

public class PostDetailsDto
{
    public PostResponseDto Post { get; set; } = new();
    public List<CommentResponseDto> Comments { get; set; } = new();
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public bool HasMore { get; set; }
}
