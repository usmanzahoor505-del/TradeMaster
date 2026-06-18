using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

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
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.Tier, u.Status, u.IsFeatured, u.CreatedAt })
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
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.Tier, u.Status, u.IsFeatured, u.CreatedAt })
            .ToListAsync();
        return Ok(teachers);
    }

    // GET /api/users/leaderboard  (public) — teachers ranked by win rate then subscribers
    [HttpGet("leaderboard")]
    [AllowAnonymous]
    public async Task<IActionResult> Leaderboard()
    {
        var teachers = await _db.Users
            .Where(u => u.Role == "Teacher" && u.Status == "Active")
            .ToListAsync();

        var cards = new List<TeacherCardDto>();
        foreach (var t in teachers)
        {
            cards.Add(await BuildTeacherCardAsync(t));
        }

        var ranked = cards
            .OrderByDescending(c => c.WinRate)
            .ThenByDescending(c => c.Subscribers)
            .ThenByDescending(c => c.TotalSignals)
            .ToList();

        return Ok(ranked);
    }

    // GET /api/users/teacher/5/public  (public) — a teacher's public profile + track record
    [HttpGet("teacher/{id:int}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicProfile(int id)
    {
        var teacher = await _db.Users.FindAsync(id);
        if (teacher == null || teacher.Role != "Teacher")
            return NotFound(new { message = "Teacher not found" });

        var card = await BuildTeacherCardAsync(teacher);
        var signals = await _db.Signals
            .Where(s => s.TeacherId == id)
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(new { profile = card, signals });
    }

    private async Task<TeacherCardDto> BuildTeacherCardAsync(User t)
    {
        var subscribers = await _db.Subscriptions
            .CountAsync(s => s.TeacherId == t.Id && s.Status == "Active");

        var signalIds = await _db.Signals
            .Where(s => s.TeacherId == t.Id)
            .Select(s => s.Id)
            .ToListAsync();

        // Win rate is derived from students' trade outcomes on this teacher's
        // signals: every student Win raises it, every Loss lowers it.
        var closedTrades = await _db.Trades
            .Where(tr => signalIds.Contains(tr.SignalId) && tr.Outcome != "Open")
            .ToListAsync();
        var wins = closedTrades.Count(tr => tr.Outcome == "Win");
        var winRate = closedTrades.Count > 0
            ? Math.Round((double)wins / closedTrades.Count * 100, 1)
            : 0;

        return new TeacherCardDto
        {
            Id = t.Id,
            Name = t.Name,
            Tier = t.Tier,
            IsFeatured = t.IsFeatured,
            Subscribers = subscribers,
            WinRate = winRate,
            TotalSignals = signalIds.Count,
            Wins = wins,
            Closed = closedTrades.Count,
            CreatedAt = t.CreatedAt
        };
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
            .Select(u => new { u.Id, u.Name, u.Email, u.Role, u.Tier, u.Status, u.IsFeatured, u.CreatedAt })
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

            if (req.IsFeatured.HasValue)
            {
                user.IsFeatured = req.IsFeatured.Value;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "User updated successfully", user.Id, user.Name, user.Role, user.Tier, user.Status, user.IsFeatured });
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

        // Win rate from students' trade outcomes on this teacher's signals.
        var teacherSignalIds = await _db.Signals
            .Where(s => s.TeacherId == id)
            .Select(s => s.Id)
            .ToListAsync();

        var closedTrades = await _db.Trades
            .Where(tr => teacherSignalIds.Contains(tr.SignalId) && tr.Outcome != "Open")
            .ToListAsync();

        int wins = closedTrades.Count(tr => tr.Outcome == "Win");
        int losses = closedTrades.Count(tr => tr.Outcome == "Loss");
        double winRate = closedTrades.Count > 0
            ? Math.Round((double)wins / closedTrades.Count * 100, 1)
            : 0;

        var earnings = await _db.Transactions
            .Where(t => t.UserId == id && t.Status == "Completed" && t.Type == "credit")
            .SumAsync(t => t.Amount);

        return Ok(new
        {
            Subscribers = subscribersCount,
            WinRate = winRate,
            Earnings = earnings,
            Wins = wins,
            Losses = losses,
            ClosedTrades = closedTrades.Count,
            TotalSignals = teacherSignalIds.Count
        });
    }
}

public class UserUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Tier { get; set; }
    public string? Status { get; set; }
    public bool? IsFeatured { get; set; }
}

public class FcmTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public class TeacherCardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public int Subscribers { get; set; }
    public double WinRate { get; set; }
    public int TotalSignals { get; set; }
    public int Wins { get; set; }
    public int Closed { get; set; }
    public DateTime CreatedAt { get; set; }
}
