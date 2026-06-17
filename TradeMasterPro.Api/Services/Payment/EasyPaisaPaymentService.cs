using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Services.Payment;

public class EasyPaisaPaymentService : IPaymentService
{
    private readonly string _storeId;
    private readonly string _hashKey;
    private readonly bool _isMockMode = true;

    public EasyPaisaPaymentService(IConfiguration config)
    {
        _storeId = config["Payments:EasyPaisa:StoreId"] ?? string.Empty;
        _hashKey = config["Payments:EasyPaisa:HashKey"] ?? string.Empty;

        if (!string.IsNullOrEmpty(_storeId) && !string.IsNullOrEmpty(_hashKey))
        {
            _isMockMode = false;
        }
    }

    public async Task<string> InitializePaymentAsync(Transaction tx, int planId, int teacherId)
    {
        // Encode metadata in GatewayRef
        tx.GatewayRef = $"easypaisa_mock_ref_plan:{planId}_teacher:{teacherId}";

        if (_isMockMode)
        {
            Console.WriteLine($"[EasyPaisa Mock Initialize] Initiating EasyPaisa checkout for Transaction ID: {tx.Id}, Amount: {tx.Amount} PKR");
            return $"https://mockgateway.com/easypaisa/pay/{tx.Id}?amount={tx.Amount}&metadata=plan:{planId},teacher:{teacherId}";
        }

        try
        {
            // TODO: EasyPaisa API integration (Hosted Checkout or OTC):
            // 1. Hosted checkout redirect url: `https://easypay.easypaisa.com.pk/easypay/Index.jsf` or Sandbox equivalents.
            // 2. Prepare payload:
            //    var postParams = new Dictionary<string, string> {
            //        { "storeId", _storeId },
            //        { "amount", tx.Amount.ToString("0.0") },
            //        { "postBackURL", "https://yourdomain.com/api/payments/webhook/easypaisa" },
            //        { "orderRefNum", tx.Id.ToString() },
            //        { "expiryDate", DateTime.Now.AddDays(1).ToString("yyyyMMdd HHmmss") },
            //        { "autoRedirect", "1" },
            //        { "paymentMethod", "MA_PAYMENT" } // Mobile Account or CC
            //    };
            // 3. Generate secure hash using SHA-256 and HMAC with _hashKey.
            // 4. Return the redirection URL appended with storeId, orderRefNum, and the hash.
            
            await Task.Yield();
            return $"https://mockgateway.com/easypaisa/pay/{tx.Id}";
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EasyPaisa Initialization Exception: {ex.Message}");
            throw;
        }
    }

    public async Task<bool> VerifyPaymentAsync(Transaction tx, string rawPayload)
    {
        if (_isMockMode)
        {
            Console.WriteLine($"[EasyPaisa Mock Verify] Verifying EasyPaisa transaction ID: {tx.Id}");
            await Task.Delay(100);
            return true;
        }

        try
        {
            // TODO: Verify EasyPaisa payment redirect:
            // 1. Parse rawPayload (the incoming query string or POST from EasyPaisa redirect URL).
            // 2. Validate authStatus == "0" or respCode == "0000" (success codes).
            // 3. Recalculate hash validation using _hashKey.
            
            await Task.Yield();
            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"EasyPaisa Verification Exception: {ex.Message}");
            return false;
        }
    }
}
