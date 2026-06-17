using Microsoft.AspNetCore.Mvc;

namespace TradeMasterPro.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "TradeMaster Pro backend chal raha hai! 🚀" });
    }
}
