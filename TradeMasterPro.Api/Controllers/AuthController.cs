using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TradeMasterPro.Api.Data;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // REGISTER -> POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == req.Email);
        if (exists) return BadRequest(new { message = "Email already registered" });

        var role = string.IsNullOrWhiteSpace(req.Role) ? "Student" : req.Role.Trim();
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Registration as Admin is not allowed." });
        }

        if (string.Equals(role, "Student", StringComparison.OrdinalIgnoreCase))
        {
            role = "Student";
        }
        else if (string.Equals(role, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            role = "Teacher";
        }
        else
        {
            return BadRequest(new { message = "Invalid role. Only 'Student' or 'Teacher' roles are allowed." });
        }

        var user = new User
        {
            Name = req.Name,
            Email = req.Email,
            Role = role,
            Tier = "Free",
            Status = "Active",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Registered successfully", user.Id, user.Name, user.Role });
    }

    // LOGIN -> POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password" });

        var ok = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
        if (!ok)
            return Unauthorized(new { message = "Invalid email or password" });

        var token = GenerateToken(user);
        return Ok(new { token, user.Id, user.Name, user.Role, user.Tier });
    }

    private string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Student";
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
