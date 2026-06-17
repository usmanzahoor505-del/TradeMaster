using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController : ControllerBase
{
    private readonly AppDbContext _db;

    public PlansController(AppDbContext db)
    {
        _db = db;
    }

    // Anyone can view plans (no login needed)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var plans = await _db.Plans.ToListAsync();
        return Ok(plans);
    }

    // Only Admin can create plans
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(Plan plan)
    {
        _db.Plans.Add(plan);
        await _db.SaveChangesAsync();
        return Ok(plan);
    }
}