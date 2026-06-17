using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace TradeMasterPro.Api.Controllers;

public class BaseApiController : ControllerBase
{
    protected int CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out var id) ? id : 0;
        }
    }

    protected string CurrentUserRole => User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

    protected bool IsAdmin => CurrentUserRole == "Admin";
}
