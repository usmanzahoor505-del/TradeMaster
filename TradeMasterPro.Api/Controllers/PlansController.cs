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

    // Admin can update an existing plan (price / commission / features)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, PlanUpdateDto req)
    {
        var plan = await _db.Plans.FindAsync(id);
        if (plan == null) return NotFound(new { message = "Plan not found" });

        if (!string.IsNullOrWhiteSpace(req.Name)) plan.Name = req.Name.Trim();
        if (req.PriceUsd.HasValue) plan.PriceUsd = req.PriceUsd.Value;
        if (req.CommissionRate.HasValue) plan.CommissionRate = req.CommissionRate.Value;
        if (!string.IsNullOrWhiteSpace(req.FeaturesJson)) plan.FeaturesJson = req.FeaturesJson;

        await _db.SaveChangesAsync();
        return Ok(plan);
    }
}

public class PlanUpdateDto
{
    public string? Name { get; set; }
    public decimal? PriceUsd { get; set; }
    public decimal? CommissionRate { get; set; }
    public string? FeaturesJson { get; set; }
}