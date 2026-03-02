using Microsoft.EntityFrameworkCore;
using RequestsForCarRepairs.API.Models;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace RequestsForCarRepairs.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Request> Requests { get; set; }
    public DbSet<Comment> Comments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Request>()
            .HasOne(r => r.Client)
            .WithMany(u => u.ClientRequests)
            .HasForeignKey(r => r.ClientID)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Request>()
            .HasOne(r => r.Master)
            .WithMany(u => u.MasterRequests)
            .HasForeignKey(r => r.MasterID)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Master)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.MasterID)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Request)
            .WithMany(r => r.Comments)
            .HasForeignKey(c => c.RequestID)
            .OnDelete(DeleteBehavior.Cascade);
    }
}