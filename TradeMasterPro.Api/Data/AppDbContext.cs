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
    public DbSet<Dispute> Disputes { get; set; }
    public DbSet<PostLike> PostLikes { get; set; }
    public DbSet<PostComment> PostComments { get; set; }
    public DbSet<PostShare> PostShares { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // One like per (post, user) — enforces toggle semantics at the DB level.
        modelBuilder.Entity<PostLike>()
            .HasIndex(l => new { l.PostId, l.UserId })
            .IsUnique();

        // Indexes for the common feed/detail access paths (avoids table scans).
        modelBuilder.Entity<PostLike>().HasIndex(l => l.UserId);
        modelBuilder.Entity<PostComment>().HasIndex(c => c.PostId);
        modelBuilder.Entity<PostComment>().HasIndex(c => c.ParentCommentId);
        modelBuilder.Entity<PostShare>().HasIndex(s => s.PostId);
        modelBuilder.Entity<Post>().HasIndex(p => p.CreatedAt);
        modelBuilder.Entity<Post>().HasIndex(p => p.UserId);
    }
}
