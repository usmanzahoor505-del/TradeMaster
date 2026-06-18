using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;
using TradeMasterPro.Api.Services.Payment;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : BaseApiController
{
    private readonly AppDbContext _db;
    private readonly PaymentFactory _paymentFactory;

    public PaymentsController(AppDbContext db, PaymentFactory paymentFactory)
    {
        _db = db;
        _paymentFactory = paymentFactory;
    }

    // POST /api/payments/initialize
    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromBody] PaymentInitRequest req)
    {
        var plan = await _db.Plans.FindAsync(req.PlanId);
        if (plan == null) return BadRequest(new { message = "Plan not found" });

        if (req.TeacherId > 0)
        {
            var teacher = await _db.Users.FindAsync(req.TeacherId);
            if (teacher == null) return BadRequest(new { message = "Teacher not found" });
            if (teacher.Role != "Teacher") return BadRequest(new { message = "Target user is not a Teacher" });

            // Enforce active plan constraints validation before starting billing
            var exists = await _db.Subscriptions.AnyAsync(s =>
                s.StudentId == CurrentUserId &&
                s.TeacherId == req.TeacherId &&
                s.Status == "Active");
            if (exists)
                return BadRequest(new { message = "You already have an active subscription to this teacher" });
        }

        // Select currency and convert amount if using local PK wallets
        var currency = "USD";
        var amount = plan.PriceUsd;
        var normalizedGateway = req.Gateway.Trim().ToLower();

        if (normalizedGateway == "jazzcash" || normalizedGateway == "easypaisa")
        {
            currency = "PKR";
            amount = plan.PriceUsd * 280; // Fixed exchange rate conversion for PK wallet
        }

        var tx = new Transaction
        {
            UserId = CurrentUserId,
            Amount = amount,
            Currency = currency,
            Type = "credit",
            Status = "Pending",
            Gateway = req.Gateway,
            CreatedAt = DateTime.UtcNow
        };

        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();

        try
        {
            var paymentService = _paymentFactory.GetPaymentService(req.Gateway);
            var checkoutUrl = await paymentService.InitializePaymentAsync(tx, req.PlanId, req.TeacherId);

            // Save the updated GatewayRef (set in the payment service)
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment initiated",
                TransactionId = tx.Id,
                CheckoutUrl = checkoutUrl,
                Amount = tx.Amount,
                Currency = tx.Currency
            });
        }
        catch (Exception ex)
        {
            tx.Status = "Failed";
            await _db.SaveChangesAsync();
            return StatusCode(500, new { message = $"Payment initialization failed: {ex.Message}" });
        }
    }

    // GET /api/payments/verify/5 (Self or Admin)
    [HttpGet("verify/{transactionId}")]
    public async Task<IActionResult> Verify(int transactionId, [FromQuery] string? rawPayload)
    {
        var tx = await _db.Transactions.FindAsync(transactionId);
        if (tx == null) return NotFound(new { message = "Transaction not found" });

        if (tx.UserId != CurrentUserId && !IsAdmin)
        {
            return Forbid();
        }

        if (tx.Status == "Completed")
        {
            return Ok(new { message = "Transaction already completed", tx.Status });
        }

        try
        {
            var paymentService = _paymentFactory.GetPaymentService(tx.Gateway);
            var isSuccess = await paymentService.VerifyPaymentAsync(tx, rawPayload ?? string.Empty);

            if (isSuccess)
            {
                tx.Status = "Completed";

                // Parse the plan metadata from GatewayRef
                var (planId, teacherId) = ParseMetadata(tx);
                if (planId > 0)
                {
                    var plan = await _db.Plans.FindAsync(planId);
                    if (plan != null)
                    {
                        var student = await _db.Users.FindAsync(tx.UserId);
                        if (student != null)
                        {
                            student.Tier = plan.Name;
                        }
                    }

                    if (teacherId > 0)
                    {
                        // Activate subscription
                        var existingSub = await _db.Subscriptions.FirstOrDefaultAsync(s => 
                            s.StudentId == tx.UserId && 
                            s.TeacherId == teacherId && 
                            s.Status == "Active");

                        if (existingSub != null)
                        {
                            existingSub.EndDate = DateTime.UtcNow.AddMonths(1);
                            existingSub.PaymentRef = tx.Id.ToString();
                        }
                        else
                        {
                            var sub = new Subscription
                            {
                                StudentId = tx.UserId,
                                TeacherId = teacherId,
                                PlanId = planId,
                                StartDate = DateTime.UtcNow,
                                EndDate = DateTime.UtcNow.AddMonths(1),
                                Status = "Active",
                                PaymentRef = tx.Id.ToString()
                            };
                            _db.Subscriptions.Add(sub);
                        }

                        // Revenue share to the Pro teacher
                        await RecordTeacherCommissionAsync(teacherId, planId);
                    }
                }

                await _db.SaveChangesAsync();
                return Ok(new { message = "Payment verified and subscription activated!", tx.Status });
            }
            else
            {
                tx.Status = "Failed";
                await _db.SaveChangesAsync();
                return BadRequest(new { message = "Payment verification failed", tx.Status });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Verification error: {ex.Message}" });
        }
    }

    // POST /api/payments/webhook/{gateway}
    [HttpPost("webhook/{gateway}")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(string gateway, [FromBody] WebhookPayload payload)
    {
        // Find transaction by gateway ref or reference
        var tx = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Gateway.ToLower() == gateway.ToLower() && t.Status == "Pending" && t.Id == payload.TransactionId);

        if (tx == null) return NotFound(new { message = "Pending transaction not found" });

        try
        {
            var paymentService = _paymentFactory.GetPaymentService(gateway);
            var isSuccess = await paymentService.VerifyPaymentAsync(tx, payload.RawData ?? string.Empty);

            if (isSuccess)
            {
                tx.Status = "Completed";
                var (planId, teacherId) = ParseMetadata(tx);

                if (planId > 0)
                {
                    var plan = await _db.Plans.FindAsync(planId);
                    if (plan != null)
                    {
                        var student = await _db.Users.FindAsync(tx.UserId);
                        if (student != null)
                        {
                            student.Tier = plan.Name;
                        }
                    }

                    if (teacherId > 0)
                    {
                        var sub = new Subscription
                        {
                            StudentId = tx.UserId,
                            TeacherId = teacherId,
                            PlanId = planId,
                            StartDate = DateTime.UtcNow,
                            EndDate = DateTime.UtcNow.AddMonths(1),
                            Status = "Active",
                            PaymentRef = tx.Id.ToString()
                        };
                        _db.Subscriptions.Add(sub);

                        // Revenue share to the Pro teacher
                        await RecordTeacherCommissionAsync(teacherId, planId);
                    }
                }

                await _db.SaveChangesAsync();
                return Ok(new { message = "Webhook processed successfully" });
            }

            return BadRequest(new { message = "Webhook verification failed" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Webhook processing exception: {ex.Message}" });
        }
    }

    // Revenue share (PRD 3.2 / 3.3): when a student pays to subscribe to a Pro
    // teacher, credit the teacher their share of the fee (commissionRate is the
    // teacher's %: 0.6 standard / 0.7 premium). Platform retains the remainder.
    // Free teachers earn nothing.
    private async Task RecordTeacherCommissionAsync(int teacherId, int planId)
    {
        var teacher = await _db.Users.FindAsync(teacherId);
        if (teacher == null || !string.Equals(teacher.Tier, "Pro", StringComparison.OrdinalIgnoreCase))
            return;

        var plan = await _db.Plans.FindAsync(planId);
        if (plan == null || plan.PriceUsd <= 0 || plan.CommissionRate <= 0)
            return;

        var teacherShare = Math.Round(plan.PriceUsd * plan.CommissionRate, 2);
        if (teacherShare <= 0) return;

        _db.Transactions.Add(new Transaction
        {
            UserId = teacherId,
            Amount = teacherShare,
            Currency = "USD",
            Type = "credit",
            Status = "Completed",
            Gateway = "platform-commission",
            GatewayRef = $"commission_plan:{planId}",
            CreatedAt = DateTime.UtcNow
        });
    }

    private (int planId, int teacherId) ParseMetadata(Transaction tx)
    {
        try
        {
            if (!string.IsNullOrEmpty(tx.GatewayRef))
            {
                var parts = tx.GatewayRef.Split('_');
                var planPart = parts.FirstOrDefault(p => p.StartsWith("plan:"));
                var teacherPart = parts.FirstOrDefault(p => p.StartsWith("teacher:"));

                if (planPart != null && teacherPart != null)
                {
                    var planId = int.Parse(planPart.Split(':')[1]);
                    var teacherId = int.Parse(teacherPart.Split(':')[1]);
                    return (planId, teacherId);
                }
            }
        }
        catch
        {
            // Fail silently and return defaults
        }
        return (0, 0);
    }
}

public class PaymentInitRequest
{
    public int PlanId { get; set; }
    public int TeacherId { get; set; }
    public string Gateway { get; set; } = string.Empty; // stripe / jazzcash / easypaisa
}

public class WebhookPayload
{
    public int TransactionId { get; set; }
    public string? RawData { get; set; }
}
