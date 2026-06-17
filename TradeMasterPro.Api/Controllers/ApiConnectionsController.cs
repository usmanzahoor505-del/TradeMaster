using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApiConnectionsController : BaseApiController
{
    private readonly AppDbContext _db;
    public ApiConnectionsController(AppDbContext db) => _db = db;

    // GET /api/apiconnections/student/2  (keys kabhi expose nahi karte)
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(int studentId)
    {
        if (studentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var items = await _db.ApiConnections
            .Where(a => a.StudentId == studentId)
            .Select(a => new { a.Id, a.Exchange, a.Permissions, a.CreatedAt })  // keys hidden
            .ToListAsync();
        return Ok(items);
    }

    // POST /api/apiconnections  (connect an exchange)
    [HttpPost]
    public async Task<IActionResult> Create(ApiConnectionRequest req)
    {
        if (req.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        var student = await _db.Users.FindAsync(req.StudentId);
        if (student == null) return BadRequest(new { message = "Student not found" });

        var conn = new ApiConnection
        {
            StudentId = req.StudentId,
            Exchange = req.Exchange,
            EncryptedApiKey = Helpers.EncryptionHelper.Encrypt(req.ApiKey),
            EncryptedSecret = Helpers.EncryptionHelper.Encrypt(req.SecretKey),
            Permissions = "trade",   // sirf trade, withdrawal kabhi nahi
            CreatedAt = DateTime.UtcNow
        };

        _db.ApiConnections.Add(conn);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Exchange connected", conn.Id, conn.Exchange });
    }

    // GET /api/apiconnections/5/decrypted (Self or Admin only)
    [HttpGet("{id}/decrypted")]
    public async Task<IActionResult> GetDecrypted(int id)
    {
        var conn = await _db.ApiConnections.FindAsync(id);
        if (conn == null) return NotFound(new { message = "Connection not found" });

        if (conn.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        return Ok(new
        {
            conn.Id,
            conn.Exchange,
            ApiKey = Helpers.EncryptionHelper.Decrypt(conn.EncryptedApiKey),
            SecretKey = Helpers.EncryptionHelper.Decrypt(conn.EncryptedSecret),
            conn.Permissions,
            conn.CreatedAt
        });
    }

    // DELETE /api/apiconnections/5  (disconnect)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var conn = await _db.ApiConnections.FindAsync(id);
        if (conn == null) return NotFound(new { message = "Connection not found" });

        if (conn.StudentId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        _db.ApiConnections.Remove(conn);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Exchange disconnected" });
    }
}

public class ApiConnectionRequest
{
    public int StudentId { get; set; }
    public string Exchange { get; set; } = string.Empty;   // Binance / Bybit
    public string ApiKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
}
