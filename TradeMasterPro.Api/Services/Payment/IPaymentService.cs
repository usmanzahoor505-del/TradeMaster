using System.Threading.Tasks;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Services.Payment;

public interface IPaymentService
{
    // Returns the checkout/payment URL
    Task<string> InitializePaymentAsync(Transaction tx, int planId, int teacherId);
    
    // Returns true if verification succeeded
    Task<bool> VerifyPaymentAsync(Transaction tx, string rawPayload);
}
