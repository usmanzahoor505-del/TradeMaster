using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : BaseApiController
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/users  (Admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.Tier, u.Status, u.CreatedAt })
            .ToListAsync();
        return Ok(users);
    }

    // GET /api/users/teachers (Open to all users including guests)
    [HttpGet("teachers")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTeachers()
    {
        var teachers = await _db.Users
            .Where(u => u.Role == "Teacher")
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.Tier, u.Status, u.CreatedAt })
            .ToListAsync();
        return Ok(teachers);
    }

    // GET /api/users/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (id != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var user = await _db.Users
            .Where(u => u.Id == id)
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.Tier, u.Status, u.CreatedAt })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound(new { message = "User not found" });
        return Ok(user);
    }

    // PUT /api/users/5 (Self or Admin)
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UserUpdateDto req)
    {
        if (id != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        if (!string.IsNullOrWhiteSpace(req.Name))
        {
            user.Name = req.Name.Trim();
        }

        if (IsAdmin)
        {
            if (!string.IsNullOrWhiteSpace(req.Role))
            {
                var role = req.Role.Trim();
                if (string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase)) user.Role = "Student";
                else if (string.Equals(role, "Teacher", StringComparison.OrdinalIgnoreCase)) user.Role = "Teacher";
                else if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)) user.Role = "Admin";
                else return BadRequest(new { message = "Invalid role value." });
            }

            if (!string.IsNullOrWhiteSpace(req.Tier))
            {
                user.Tier = req.Tier.Trim();
            }

            if (!string.IsNullOrWhiteSpace(req.Status))
            {
                var status = req.Status.Trim();
                if (string.Equals(status, "Active", StringComparison.OrdinalIgnoreCase)) user.Status = "Active";
                else if (string.Equals(status, "Suspended", StringComparison.OrdinalIgnoreCase)) user.Status = "Suspended";
                else if (string.Equals(status, "Banned", StringComparison.OrdinalIgnoreCase)) user.Status = "Banned";
                else return BadRequest(new { message = "Invalid status value." });
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "User updated successfully", user.Id, user.Name, user.Role, user.Tier, user.Status });
    }

    [HttpPut("fcm-token")]
    public async Task<IActionResult> UpdateFcmToken([FromBody] FcmTokenRequest req)
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return NotFound(new { message = "User not found" });

        user.FcmToken = req.Token;
        await _db.SaveChangesAsync();
        return Ok(new { message = "FCM Token updated successfully" });
    }

    [HttpGet("teacher/{id:int}/stats")]
    public async Task<IActionResult> GetTeacherStats(int id)
    {
        if (id != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var teacher = await _db.Users.FindAsync(id);
        if (teacher == null || teacher.Role != "Teacher")
            return BadRequest(new { message = "Teacher not found" });

        var subscribersCount = await _db.Subscriptions
            .Where(s => s.TeacherId == id && s.Status == "Active")
            .CountAsync();

        var signals = await _db.Signals
            .Where(s => s.TeacherId == id && s.Status != "Active")
            .ToListAsync();
        
        double winRate = 0;
        if (signals.Count > 0)
        {
            int wins = signals.Count(s => s.Status == "Hit TP1" || s.Status == "Hit TP2" || s.Status == "Completed");
            winRate = (double)wins / signals.Count * 100;
        }

        var earnings = await _db.Transactions
            .Where(t => t.UserId == id && t.Status == "Completed" && t.Type == "credit")
            .SumAsync(t => t.Amount);

        return Ok(new
        {
            Subscribers = subscribersCount,
            WinRate = Math.Round(winRate, 1),
            Earnings = earnings
        });
    }
}

public class UserUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Tier { get; set; }
    public string? Status { get; set; }
}

public class FcmTokenRequest
{
    public string Token { get; set; } = string.Empty;
}
