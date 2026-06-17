using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Hubs;
using TradeMasterPro.Api.Services;
using TradeMasterPro.Api.Services.Payment;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

var encryptionKey = builder.Configuration["Encryption:Key"] ?? "FallbackSecretKeyForTradeMasterProEncryptionKey";
TradeMasterPro.Api.Helpers.EncryptionHelper.Initialize(encryptionKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddSingleton<FirebaseService>();

// Register CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register Payment Gateways
builder.Services.AddScoped<StripePaymentService>();
builder.Services.AddScoped<JazzCashPaymentService>();
builder.Services.AddScoped<EasyPaisaPaymentService>();
builder.Services.AddScoped<PaymentFactory>();

var app = builder.Build();

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!db.Plans.Any())
    {
        db.Plans.AddRange(new List<TradeMasterPro.Api.Models.Plan>
        {
            new TradeMasterPro.Api.Models.Plan 
            { 
                Name = "Basic", 
                PriceUsd = 0, 
                CommissionRate = 0, 
                FeaturesJson = "[\"Free Teachers only\", \"Follow up to 3 teachers\", \"Manual copy\"]" 
            },
            new TradeMasterPro.Api.Models.Plan 
            { 
                Name = "Silver", 
                PriceUsd = 9.99m, 
                CommissionRate = 0.6m, 
                FeaturesJson = "[\"Free + up to 3 Pro Teachers\", \"Follow 10 teachers\", \"One-click copy\", \"No ads\"]" 
            },
            new TradeMasterPro.Api.Models.Plan 
            { 
                Name = "Gold", 
                PriceUsd = 24.99m, 
                CommissionRate = 0.6m, 
                FeaturesJson = "[\"All teachers unlimited\", \"Priority signal delivery\", \"Portfolio analytics\", \"Risk management\"]" 
            },
            new TradeMasterPro.Api.Models.Plan 
            { 
                Name = "Platinum", 
                PriceUsd = 49.99m, 
                CommissionRate = 0.7m, 
                FeaturesJson = "[\"Auto-Copy Bot\", \"VIP support\", \"Full API access\", \"1-on-1 coaching\"]" 
            }
        });
        db.SaveChanges();
    }

    if (!db.Users.Any(u => u.Role == "Admin"))
    {
        db.Users.Add(new TradeMasterPro.Api.Models.User
        {
            Name = "Admin User",
            Email = "admin@trademaster.com",
            Role = "Admin",
            Tier = "Pro",
            Status = "Active",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("AdminPassword123")
        });
        db.SaveChanges();
    }
}


if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowReactApp");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<SignalHub>("/hubs/signals");

app.Run();
