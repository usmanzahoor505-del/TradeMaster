using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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

    public PostsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/posts
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _db.Posts
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        return Ok(posts);
    }

    // POST /api/posts
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Create([FromBody] PostCreateDto req)
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        var post = new Post
        {
            UserId = user.Id,
            UserName = user.Name,
            UserAvatar = user.Name.Substring(0, Math.Min(2, user.Name.Length)).ToUpper(),
            Content = req.Content,
            Image = req.Image,
            LikesCount = 0,
            LikedByIds = new List<int>(),
            CommentsJson = "[]",
            CreatedAt = DateTime.UtcNow
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        return Ok(post);
    }

    // POST /api/posts/{id}/like
    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Post not found" });

        if (post.LikedByIds.Contains(CurrentUserId))
        {
            post.LikedByIds.Remove(CurrentUserId);
        }
        else
        {
            post.LikedByIds.Add(CurrentUserId);
        }

        post.LikesCount = post.LikedByIds.Count;
        await _db.SaveChangesAsync();

        return Ok(post);
    }

    // POST /api/posts/{id}/comment
    [HttpPost("{id}/comment")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CommentCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Text))
            return BadRequest(new { message = "Comment text is required" });

        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Post not found" });

        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return Unauthorized();

        // Deserialize existing comments
        var comments = new List<CommentDto>();
        try
        {
            comments = JsonSerializer.Deserialize<List<CommentDto>>(post.CommentsJson) ?? new List<CommentDto>();
        }
        catch { }

        comments.Add(new CommentDto
        {
            Id = DateTime.UtcNow.Ticks,
            UserName = user.Name,
            Text = req.Text
        });

        post.CommentsJson = JsonSerializer.Serialize(comments);
        await _db.SaveChangesAsync();

        return Ok(post);
    }

    // DELETE /api/posts/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post == null) return NotFound(new { message = "Post not found" });

        if (post.UserId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Post deleted successfully" });
    }
}

public class PostCreateDto
{
    public string Content { get; set; } = string.Empty;
    public string? Image { get; set; }
}

public class CommentCreateDto
{
    public string Text { get; set; } = string.Empty;
}

public class CommentDto
{
    public long Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
}
