using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;
using TradeMasterPro.Api.Hubs;
using TradeMasterPro.Api.Services;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SignalsController : BaseApiController
{
    private readonly AppDbContext _db;
    private readonly IHubContext<SignalHub> _hubContext;
    private readonly FirebaseService _firebaseService;
    private static readonly HttpClient _httpClient = new HttpClient();

    public SignalsController(AppDbContext db, IHubContext<SignalHub> hubContext, FirebaseService firebaseService)
    {
        _db = db;
        _hubContext = hubContext;
        _firebaseService = firebaseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (IsAdmin || CurrentUserRole == "Teacher")
        {
            var signals = await _db.Signals
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return Ok(signals);
        }

        if (CurrentUserRole == "Student")
        {
            var student = await _db.Users.FindAsync(CurrentUserId);
            if (student == null) return Unauthorized();

            var studentPlan = student.Tier;

            if (studentPlan == "Basic" || string.Equals(studentPlan, "Free", StringComparison.OrdinalIgnoreCase))
            {
                var freeTeacherIds = await _db.Users
                    .Where(u => u.Role == "Teacher" && u.Tier == "Free")
                    .Select(u => u.Id)
                    .ToListAsync();

                var signals = await _db.Signals
                    .Where(s => freeTeacherIds.Contains(s.TeacherId))
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();
                return Ok(signals);
            }
            else if (studentPlan == "Silver")
            {
                var freeTeacherIds = await _db.Users
                    .Where(u => u.Role == "Teacher" && u.Tier == "Free")
                    .Select(u => u.Id)
                    .ToListAsync();

                var activeSubscribedTeacherIds = await _db.Subscriptions
                    .Where(sub => sub.StudentId == CurrentUserId && sub.Status == "Active")
                    .Select(sub => sub.TeacherId)
                    .ToListAsync();

                var allowedTeacherIds = freeTeacherIds.Concat(activeSubscribedTeacherIds).Distinct().ToList();

                var signals = await _db.Signals
                    .Where(s => allowedTeacherIds.Contains(s.TeacherId))
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();
                return Ok(signals);
            }
            else
            {
                var signals = await _db.Signals
                    .OrderByDescending(s => s.CreatedAt)
                    .ToListAsync();
                return Ok(signals);
            }
        }

        return Forbid();
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var signal = await _db.Signals.FindAsync(id);
        if (signal == null) return NotFound(new { message = "Signal not found" });

        if (IsAdmin || CurrentUserRole == "Teacher")
        {
            return Ok(signal);
        }

        if (CurrentUserRole == "Student")
        {
            var teacher = await _db.Users.FindAsync(signal.TeacherId);
            if (teacher == null) return BadRequest(new { message = "Teacher not found" });

            if (teacher.Tier == "Pro")
            {
                var student = await _db.Users.FindAsync(CurrentUserId);
                if (student == null) return Unauthorized();

                var studentPlan = student.Tier;
                if (studentPlan == "Basic" || string.Equals(studentPlan, "Free", StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
                else if (studentPlan == "Silver")
                {
                    var isSubscribed = await _db.Subscriptions.AnyAsync(sub =>
                        sub.StudentId == CurrentUserId &&
                        sub.TeacherId == signal.TeacherId &&
                        sub.Status == "Active");

                    if (!isSubscribed)
                    {
                        return Forbid();
                    }
                }
            }

            return Ok(signal);
        }

        return Forbid();
    }

    [HttpGet("teacher/{teacherId}")]
    public async Task<IActionResult> GetByTeacher(int teacherId)
    {
        var teacher = await _db.Users.FindAsync(teacherId);
        if (teacher == null) return NotFound(new { message = "Teacher not found" });

        if (!IsAdmin && CurrentUserRole != "Teacher")
        {
            if (teacher.Tier == "Pro")
            {
                var student = await _db.Users.FindAsync(CurrentUserId);
                if (student == null) return Unauthorized();

                var studentPlan = student.Tier;
                if (studentPlan == "Basic" || string.Equals(studentPlan, "Free", StringComparison.OrdinalIgnoreCase))
                {
                    return Forbid();
                }
                else if (studentPlan == "Silver")
                {
                    var isSubscribed = await _db.Subscriptions.AnyAsync(sub =>
                        sub.StudentId == CurrentUserId &&
                        sub.TeacherId == teacherId &&
                        sub.Status == "Active");

                    if (!isSubscribed)
                    {
                        return Forbid();
                    }
                }
            }
        }

        var signals = await _db.Signals
            .Where(s => s.TeacherId == teacherId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return Ok(signals);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Create(Signal signal)
    {
        var teacher = await _db.Users.FindAsync(CurrentUserId);
        if (teacher == null)
            return BadRequest(new { message = "Teacher not found" });
        if (teacher.Role != "Teacher")
            return BadRequest(new { message = "Only a Teacher can create a signal" });

        signal.TeacherId = CurrentUserId;
        signal.Status = "Active";
        signal.CreatedAt = DateTime.UtcNow;

        _db.Signals.Add(signal);
        await _db.SaveChangesAsync();

        // Real-time broadcast
        if (string.Equals(teacher.Tier, "Free", StringComparison.OrdinalIgnoreCase))
        {
            await _hubContext.Clients.All.SendAsync("ReceiveSignal", signal);
        }
        else
        {
            await _hubContext.Clients.Group($"Teacher_{CurrentUserId}").SendAsync("ReceiveSignal", signal);
        }

        // Fetch recipient student tokens for FCM Push Notification
        List<string> studentTokens;
        if (string.Equals(teacher.Tier, "Free", StringComparison.OrdinalIgnoreCase))
        {
            // Free signal: Push to all students
            studentTokens = await _db.Users
                .Where(u => u.Role == "Student" && !string.IsNullOrEmpty(u.FcmToken))
                .Select(u => u.FcmToken!)
                .ToListAsync();
        }
        else
        {
            // Pro signal: Push only to subscribed students
            studentTokens = await _db.Subscriptions
                .Where(sub => sub.TeacherId == CurrentUserId && sub.Status == "Active")
                .Join(_db.Users,
                      sub => sub.StudentId,
                      u => u.Id,
                      (sub, u) => new { u.Role, u.FcmToken })
                .Where(x => x.Role == "Student" && !string.IsNullOrEmpty(x.FcmToken))
                .Select(x => x.FcmToken!)
                .ToListAsync();
        }

        var pushTitle = $"New Signal: {signal.Pair} ({signal.Action.ToUpper()})";
        var pushBody = $"Entry: {signal.EntryLow} - {signal.EntryHigh} | TP1: {signal.Tp1} | SL: {signal.Sl}";
        
        // Trigger FCM background push task
        _ = Task.Run(async () =>
        {
            try
            {
                await _firebaseService.SendNotificationToUsersAsync(studentTokens, pushTitle, pushBody);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in background FCM push thread: {ex.Message}");
            }
        });

        // Trigger Python Auto-Copy Trading Bot execution
        _ = Task.Run(async () =>
        {
            try
            {
                var payload = new
                {
                    signal_id = signal.Id,
                    secret_token = "TradeMasterProSecretToken1212"
                };
                var content = new StringContent(
                    System.Text.Json.JsonSerializer.Serialize(payload),
                    System.Text.Encoding.UTF8,
                    "application/json"
                );
                
                var response = await _httpClient.PostAsync("http://localhost:8000/api/bot/execute-signal", content);
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[C# Trigger] Successfully triggered Python Auto-Copy Bot for Signal #{signal.Id}");
                }
                else
                {
                    Console.WriteLine($"[C# Trigger] Failed to trigger Python Auto-Copy Bot. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[C# Trigger] Error calling Python Bot: {ex.Message}");
            }
        });

        return Ok(signal);
    }

    [HttpPut("{id}/close")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Close(int id)
    {
        var signal = await _db.Signals.FindAsync(id);
        if (signal == null) return NotFound(new { message = "Signal not found" });

        if (signal.TeacherId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        signal.Status = "Closed";
        await _db.SaveChangesAsync();
        return Ok(signal);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Update(int id, SignalUpdateDto req)
    {
        var signal = await _db.Signals.FindAsync(id);
        if (signal == null) return NotFound(new { message = "Signal not found" });

        if (signal.TeacherId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        if (signal.Status == "Closed" && !IsAdmin)
        {
            return BadRequest(new { message = "Cannot update a closed signal" });
        }

        signal.Pair = req.Pair;
        signal.Action = req.Action;
        signal.EntryLow = req.EntryLow;
        signal.EntryHigh = req.EntryHigh;
        signal.Tp1 = req.Tp1;
        signal.Tp2 = req.Tp2;
        signal.Sl = req.Sl;
        signal.Leverage = req.Leverage;
        signal.RiskLevel = req.RiskLevel;

        bool statusChanged = false;
        if (!string.IsNullOrEmpty(req.Status) && req.Status != signal.Status)
        {
            signal.Status = req.Status;
            statusChanged = true;
        }

        await _db.SaveChangesAsync();

        if (statusChanged)
        {
            await CheckTeacherTierUpgradeAsync(signal.TeacherId);
        }

        return Ok(signal);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var signal = await _db.Signals.FindAsync(id);
        if (signal == null) return NotFound(new { message = "Signal not found" });

        if (signal.TeacherId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        _db.Signals.Remove(signal);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Signal deleted successfully" });
    }

    private async Task CheckTeacherTierUpgradeAsync(int teacherId)
    {
        var teacher = await _db.Users.FindAsync(teacherId);
        if (teacher == null || teacher.Tier == "Pro") return;

        // Upgrade Criteria System tracks 3 months of consecutive performance. 
        // Upgrade is offered automatically at 60%+ win rate, or 70%+ win rate fast-tracks the upgrade after 6 weeks.
        
        var date3MonthsAgo = DateTime.UtcNow.AddMonths(-3);
        var date6WeeksAgo = DateTime.UtcNow.AddDays(-42);

        var signals = await _db.Signals
            .Where(s => s.TeacherId == teacherId && s.Status != "Active")
            .ToListAsync();

        if (signals.Count == 0) return;

        // Calculate Win Rate for 3 months
        var signals3Months = signals.Where(s => s.CreatedAt >= date3MonthsAgo).ToList();
        int total3Months = signals3Months.Count;
        if (total3Months >= 10) // minimum 10 signals to avoid skewed stats
        {
            int wins3Months = signals3Months.Count(s => s.Status == "Hit TP1" || s.Status == "Hit TP2" || s.Status == "Completed");
            double winRate3Months = (double)wins3Months / total3Months * 100;

            if (winRate3Months >= 60)
            {
                teacher.Tier = "Pro";
                await _db.SaveChangesAsync();
                return;
            }
        }

        // Calculate Win Rate for 6 weeks (fast-track)
        var signals6Weeks = signals.Where(s => s.CreatedAt >= date6WeeksAgo).ToList();
        int total6Weeks = signals6Weeks.Count;
        if (total6Weeks >= 5) // minimum 5 signals for fast track
        {
            int wins6Weeks = signals6Weeks.Count(s => s.Status == "Hit TP1" || s.Status == "Hit TP2" || s.Status == "Completed");
            double winRate6Weeks = (double)wins6Weeks / total6Weeks * 100;

            if (winRate6Weeks >= 70)
            {
                teacher.Tier = "Pro";
                await _db.SaveChangesAsync();
                return;
            }
        }
    }
}

public class SignalUpdateDto
{
    public string Pair { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public decimal EntryLow { get; set; }
    public decimal EntryHigh { get; set; }
    public decimal Tp1 { get; set; }
    public decimal? Tp2 { get; set; }
    public decimal Sl { get; set; }
    public string Leverage { get; set; } = string.Empty;
    public string RiskLevel { get; set; } = "LOW";
    public string? Status { get; set; }
}