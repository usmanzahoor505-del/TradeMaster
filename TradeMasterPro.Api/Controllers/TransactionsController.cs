using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : BaseApiController
{
    private readonly AppDbContext _db;
    public TransactionsController(AppDbContext db) => _db = db;

    // GET /api/transactions/user/2
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        if (userId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var items = await _db.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
        return Ok(items);
    }

    // POST /api/transactions
    [HttpPost]
    public async Task<IActionResult> Create(Transaction tx)
    {
        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return BadRequest(new { message = "User not found" });

        tx.UserId = CurrentUserId;
        tx.Status = "Pending";
        tx.CreatedAt = DateTime.UtcNow;
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();
        return Ok(tx);
    }

    // PUT /api/transactions/5/status?status=Completed
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status)
    {
        var tx = await _db.Transactions.FindAsync(id);
        if (tx == null) return NotFound(new { message = "Transaction not found" });

        tx.Status = status;   // Completed / Failed
        await _db.SaveChangesAsync();
        return Ok(tx);
    }
}
