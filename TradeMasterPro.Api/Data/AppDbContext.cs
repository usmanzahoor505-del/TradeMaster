using Microsoft.EntityFrameworkCore;
using TradeMasterPro.Api.Models;

namespace TradeMasterPro.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Signal> Signals { get; set; }
    public DbSet<Plan> Plans { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<Trade> Trades { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ApiConnection> ApiConnections { get; set; }
    public DbSet<Post> Posts { get; set; }
}
