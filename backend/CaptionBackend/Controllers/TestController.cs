using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CaptionBackend.Hubs;

namespace CaptionBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IHubContext<CaptionHub> _hubContext;

    public TestController(IHubContext<CaptionHub> hubContext)
    {
        _hubContext = hubContext;
    }

    [HttpPost("ping")]
    public async Task<IActionResult> Ping()
    {
        await _hubContext.Clients.All.SendAsync("ReceiveTestMessage", "Hello from server!");
        return Ok(new { message = "Broadcast sent" });
    }
}