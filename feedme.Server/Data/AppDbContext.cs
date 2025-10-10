using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace feedme.Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public const string ConnectionStringName = "WarehouseDb";

    public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<InventoryDocument> InventoryDocuments => Set<InventoryDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
