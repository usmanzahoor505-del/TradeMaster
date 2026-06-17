using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly AppDbContext _db;
    public NotificationsController(AppDbContext db) => _db = db;

    // GET /api/notifications/user/2
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        if (userId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var items = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.SentAt)
            .ToListAsync();
        return Ok(items);
    }

    // POST /api/notifications (Only Admin or Teacher can send/create notifications)
    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> Create(Notification n)
    {
        var user = await _db.Users.FindAsync(n.UserId);
        if (user == null) return BadRequest(new { message = "Recipient user not found" });

        n.SentAt = DateTime.UtcNow;
        n.ReadAt = null;
        _db.Notifications.Add(n);
        await _db.SaveChangesAsync();
        return Ok(n);
    }

    // PUT /api/notifications/5/read
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound(new { message = "Notification not found" });

        if (n.UserId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        n.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(n);
    }

    // GET /api/notifications (Admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.Notifications.ToListAsync();
        return Ok(items);
    }

    // DELETE /api/notifications/5 (Admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return NotFound(new { message = "Notification not found" });

        _db.Notifications.Remove(n);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Notification deleted successfully" });
    }
}
