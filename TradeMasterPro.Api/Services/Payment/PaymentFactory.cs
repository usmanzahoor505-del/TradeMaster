using System;
using Microsoft.Extensions.DependencyInjection;

namespace TradeMasterPro.Api.Services.Payment;

public class PaymentFactory
{
    private readonly IServiceProvider _serviceProvider;

    public PaymentFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IPaymentService GetPaymentService(string gateway)
    {
        if (string.IsNullOrEmpty(gateway))
        {
            throw new ArgumentException("Payment gateway cannot be empty.");
        }

        var normalizedGateway = gateway.Trim().ToLower();

        return normalizedGateway switch
        {
            "stripe" => _serviceProvider.GetRequiredService<StripePaymentService>(),
            "jazzcash" => _serviceProvider.GetRequiredService<JazzCashPaymentService>(),
            "easypaisa" => _serviceProvider.GetRequiredService<EasyPaisaPaymentService>(),
            _ => throw new NotSupportedException($"Payment gateway '{gateway}' is not supported.")
        };
    }
}
