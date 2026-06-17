using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Services.Payment;

public class StripePaymentService : IPaymentService
{
    private readonly string _secretKey;
    private readonly bool _isMockMode = true;

    public StripePaymentService(IConfiguration config)
    {
        _secretKey = config["Payments:Stripe:SecretKey"] ?? string.Empty;
        if (!string.IsNullOrEmpty(_secretKey))
        {
            _isMockMode = false;
        }
    }

    public async Task<string> InitializePaymentAsync(Transaction tx, int planId, int teacherId)
    {
        // Save plan and teacher metadata inside Transaction GatewayRef for retrieval on verification
        tx.GatewayRef = $"stripe_mock_ref_plan:{planId}_teacher:{teacherId}";

        if (_isMockMode)
        {
            Console.WriteLine($"[Stripe Mock Initialize] Initiating Stripe payment session for Transaction ID: {tx.Id}, Amount: {tx.Amount}");
            // Return a mock payment page URL
            return $"https://mockgateway.com/stripe/pay/{tx.Id}?amount={tx.Amount}&metadata=plan:{planId},teacher:{teacherId}";
        }

        try
        {
            // TODO: Production integration when secret key is provided:
            // 1. Install Stripe.net NuGet package
            // 2. Set StripeConfiguration.ApiKey = _secretKey;
            // 3. Create SessionCreateOptions:
            //    var options = new SessionCreateOptions {
            //        PaymentMethodTypes = new List<string> { "card" },
            //        LineItems = new List<SessionLineItemOptions> {
            //            new SessionLineItemOptions {
            //                PriceData = new SessionLineItemPriceDataOptions {
            //                    UnitAmount = (long)(tx.Amount * 100), // Stripe takes amounts in cents
            //                    Currency = tx.Currency.ToLower(),
            //                    ProductData = new SessionLineItemPriceDataProductDataOptions { Name = $"Plan Subscription" }
            //                },
            //                Quantity = 1
            //            }
            //        },
            //        Mode = "subscription" or "payment",
            //        SuccessUrl = "https://yourdomain.com/payments/success?session_id={CHECKOUT_SESSION_ID}",
            //        CancelUrl = "https://yourdomain.com/payments/cancel",
            //        Metadata = new Dictionary<string, string> {
            //            { "PlanId", planId.ToString() },
            //            { "TeacherId", teacherId.ToString() },
            //            { "TransactionId", tx.Id.ToString() }
            //        }
            //    };
            // 4. var service = new SessionService();
            //    Session session = await service.CreateAsync(options);
            // 5. tx.GatewayRef = session.Id; // Update gateway ref to stripe session ID
            //    return session.Url;
            
            await Task.Yield();
            return $"https://mockgateway.com/stripe/pay/{tx.Id}";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Stripe Initialization Exception: {ex.Message}");
            throw;
        }
    }

    public async Task<bool> VerifyPaymentAsync(Transaction tx, string rawPayload)
    {
        if (_isMockMode)
        {
            Console.WriteLine($"[Stripe Mock Verify] Verifying Stripe transaction ID: {tx.Id}");
            await Task.Delay(100); // Simulate network latency
            return true; // Auto-pass in mock mode
        }

        try
        {
            // TODO: Production verification logic:
            // 1. Retrieve session: var service = new SessionService();
            //    Session session = await service.GetAsync(tx.GatewayRef);
            // 2. Check status: if (session.PaymentStatus == "paid") return true;
            
            await Task.Yield();
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Stripe Verification Exception: {ex.Message}");
            return false;
        }
    }
}
