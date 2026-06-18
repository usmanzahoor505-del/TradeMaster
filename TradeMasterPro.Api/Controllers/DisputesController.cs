using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DisputesController : BaseApiController
{
    private readonly AppDbContext _db;

    public DisputesController(AppDbContext db)
    {
        _db = db;
    }

    // POST /api/disputes — any authenticated user (student or teacher) can file a dispute
    [HttpPost]
    public async Task<IActionResult> Create(DisputeCreateDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Subject))
            return BadRequest(new { message = "Subject is required." });

        var dispute = new Dispute
        {
            RaisedById = CurrentUserId,
            AgainstId = req.AgainstId,
            Subject = req.Subject.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };

        _db.Disputes.Add(dispute);
        await _db.SaveChangesAsync();
        return Ok(dispute);
    }

    // GET /api/disputes — Admin sees all disputes
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var disputes = await _db.Disputes
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
        return Ok(disputes);
    }

    // GET /api/disputes/mine — disputes raised by the current user
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var disputes = await _db.Disputes
            .Where(d => d.RaisedById == CurrentUserId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
        return Ok(disputes);
    }

    // PUT /api/disputes/5/resolve — Admin resolves or rejects a dispute
    [HttpPut("{id}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Resolve(int id, DisputeResolveDto req)
    {
        var dispute = await _db.Disputes.FindAsync(id);
        if (dispute == null) return NotFound(new { message = "Dispute not found" });

        var status = req.Status?.Trim();
        if (status != "Resolved" && status != "Rejected" && status != "Open")
            return BadRequest(new { message = "Status must be Open, Resolved or Rejected." });

        dispute.Status = status;
        dispute.Resolution = req.Resolution?.Trim();
        dispute.ResolvedAt = status == "Open" ? null : DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(dispute);
    }
}

public class DisputeCreateDto
{
    public int? AgainstId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class DisputeResolveDto
{
    public string Status { get; set; } = "Resolved";
    public string? Resolution { get; set; }
}
