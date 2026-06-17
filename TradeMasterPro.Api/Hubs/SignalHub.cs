using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TradeMasterPro.Api.Hubs;

[Authorize]
public class SignalHub : Hub
{
    public async Task JoinTeacherGroup(string teacherId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Teacher_{teacherId}");
    }

    public async Task LeaveTeacherGroup(string teacherId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Teacher_{teacherId}");
    }
}
