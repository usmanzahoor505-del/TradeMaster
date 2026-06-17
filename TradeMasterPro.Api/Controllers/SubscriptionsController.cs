using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubscriptionsController : BaseApiController
{
    private readonly AppDbContext _db;

    public SubscriptionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        if (studentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var subs = await _db.Subscriptions
            .Where(s => s.StudentId == studentId)
            .ToListAsync();
        return Ok(subs);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var subs = await _db.Subscriptions.ToListAsync();
        return Ok(subs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sub = await _db.Subscriptions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "Subscription not found" });

        if (sub.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        return Ok(sub);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create(Subscription sub)
    {
        var student = await _db.Users.FindAsync(CurrentUserId);
        if (student == null) return BadRequest(new { message = "Student not found" });
        if (student.Role != "Student")
            return BadRequest(new { message = "Only a Student can subscribe" });

        var teacher = await _db.Users.FindAsync(sub.TeacherId);
        if (teacher == null) return BadRequest(new { message = "Teacher not found" });
        if (teacher.Role != "Teacher")
            return BadRequest(new { message = "Target user is not a Teacher" });

        var plan = await _db.Plans.FindAsync(sub.PlanId);
        if (plan == null) return BadRequest(new { message = "Plan not found" });

        // Enforce Subscription Plan Limits
        var studentPlan = student.Tier; // Basic, Silver, Gold, Platinum
        var activeSubs = await _db.Subscriptions
            .Where(s => s.StudentId == CurrentUserId && s.Status == "Active")
            .ToListAsync();

        if (string.Equals(studentPlan, "Basic", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(studentPlan, "Free", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.Equals(teacher.Tier, "Free", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Basic plan only allows subscribing to Free Teachers." });
            }
            if (activeSubs.Count >= 3)
            {
                return BadRequest(new { message = "Basic plan allows subscribing to a maximum of 3 teachers." });
            }
        }
        else if (string.Equals(studentPlan, "Silver", StringComparison.OrdinalIgnoreCase))
        {
            if (activeSubs.Count >= 10)
            {
                return BadRequest(new { message = "Silver plan allows subscribing to a maximum of 10 teachers." });
            }

            if (string.Equals(teacher.Tier, "Pro", StringComparison.OrdinalIgnoreCase))
            {
                var activeProTeachersCount = 0;
                foreach (var activeSub in activeSubs)
                {
                    var activeTeacher = await _db.Users.FindAsync(activeSub.TeacherId);
                    if (activeTeacher != null && string.Equals(activeTeacher.Tier, "Pro", StringComparison.OrdinalIgnoreCase))
                    {
                        activeProTeachersCount++;
                    }
                }

                if (activeProTeachersCount >= 3)
                {
                    return BadRequest(new { message = "Silver plan allows subscribing to a maximum of 3 Pro Teachers." });
                }
            }
        }

        var exists = await _db.Subscriptions.AnyAsync(s =>
            s.StudentId == CurrentUserId &&
            s.TeacherId == sub.TeacherId &&
            s.Status == "Active");
        if (exists)
            return BadRequest(new { message = "Already subscribed to this teacher" });

        sub.StudentId = CurrentUserId;
        sub.Status = "Active";
        sub.StartDate = DateTime.UtcNow;

        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var sub = await _db.Subscriptions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "Subscription not found" });

        if (sub.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        sub.Status = "Cancelled";
        sub.EndDate = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(sub);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var sub = await _db.Subscriptions.FindAsync(id);
        if (sub == null) return NotFound(new { message = "Subscription not found" });

        _db.Subscriptions.Remove(sub);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Subscription deleted successfully" });
    }
}