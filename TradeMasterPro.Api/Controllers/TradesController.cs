using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TradesController : BaseApiController
{
    private readonly AppDbContext _db;

    public TradesController(AppDbContext db)
    {
        _db = db;
    }

    // Get all trades of a student  ->  GET /api/trades/student/2
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        if (studentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var trades = await _db.Trades
            .Where(t => t.StudentId == studentId)
            .ToListAsync();
        return Ok(trades);
    }

    // GET /api/trades (Admin only)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var trades = await _db.Trades.ToListAsync();
        return Ok(trades);
    }

    // GET /api/trades/5 (Self or Admin)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var trade = await _db.Trades.FindAsync(id);
        if (trade == null) return NotFound(new { message = "Trade not found" });

        if (trade.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        return Ok(trade);
    }

    // Open a trade from a signal  ->  POST /api/trades
    [HttpPost]
    public async Task<IActionResult> Create(Trade trade)
    {
        var student = await _db.Users.FindAsync(CurrentUserId);
        if (student == null) return BadRequest(new { message = "Student not found" });

        var signal = await _db.Signals.FindAsync(trade.SignalId);
        if (signal == null) return BadRequest(new { message = "Signal not found" });

        trade.StudentId = CurrentUserId;
        trade.Outcome = "Open";
        trade.ExitPrice = null;
        trade.Pnl = null;
        trade.ClosedAt = null;

        _db.Trades.Add(trade);
        await _db.SaveChangesAsync();
        return Ok(trade);
    }

    // Close a trade with exit price  ->  PUT /api/trades/5/close?exitPrice=68000
    [HttpPut("{id}/close")]
    public async Task<IActionResult> Close(int id, [FromQuery] decimal exitPrice)
    {
        var trade = await _db.Trades.FindAsync(id);
        if (trade == null) return NotFound(new { message = "Trade not found" });

        if (trade.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        trade.ExitPrice = exitPrice;
        trade.ClosedAt = DateTime.UtcNow;
        trade.Pnl = exitPrice - trade.EntryPrice;       // simple P&L
        trade.Outcome = trade.Pnl > 0 ? "Win" : "Loss"; // Win/Loss

        await _db.SaveChangesAsync();
        return Ok(trade);
    }

    // DELETE /api/trades/5 (Admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var trade = await _db.Trades.FindAsync(id);
        if (trade == null) return NotFound(new { message = "Trade not found" });

        _db.Trades.Remove(trade);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Trade deleted successfully" });
    }
}
