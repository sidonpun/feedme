using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace feedme.Server.Data.Seed;

internal static class AppDbContextSeeder
{
    public static async Task SeedAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        await SeedCatalogItemsAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedInventoryDocumentsAsync(context, cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedCatalogItemsAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var existingCodes = await context.CatalogItems
            .AsNoTracking()
            .Select(item => item.Code)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var missingItems = CatalogItemSeedData.Items
            .Where(item => !existingCodes.Contains(item.Code, StringComparer.OrdinalIgnoreCase))
            .Select(CloneCatalogItem)
            .ToArray();

        if (missingItems.Length == 0)
        {
            return;
        }

        await context.CatalogItems.AddRangeAsync(missingItems, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedInventoryDocumentsAsync(AppDbContext context, CancellationToken cancellationToken)
    {
        var hasInventories = await context.InventoryDocuments
            .AsNoTracking()
            .AnyAsync(cancellationToken)
            .ConfigureAwait(false);

        if (hasInventories)
        {
            return;
        }

        var sampleItems = await context.CatalogItems
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .Take(5)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        if (sampleItems.Count == 0)
        {
            return;
        }

        var completedDocument = new InventoryDocument
        {
            Number = "INV-0001",
            Warehouse = "Главный склад",
            Responsible = "Иван Петров",
            StartedAt = DateTime.UtcNow.AddDays(-5),
            CompletedAt = DateTime.UtcNow.AddDays(-4),
            Status = InventoryDocumentStatuses.Completed,
            Items = sampleItems.Select((item, index) =>
            {
                var expected = 10m + index * 3;
                var counted = expected - (index % 2 == 0 ? 1 : -2);

                return new InventoryLine
                {
                    CatalogItemId = item.Id,
                    Sku = item.Code,
                    ItemName = item.Name,
                    Category = item.Category,
                    ExpectedQuantity = Math.Max(0m, expected),
                    CountedQuantity = Math.Max(0m, counted),
                    Unit = item.Unit,
                    UnitPrice = Math.Max(0m, Convert.ToDecimal(item.UnitPrice)),
                };
            }).ToList(),
        };

        var draftDocument = new InventoryDocument
        {
            Number = "INV-0002",
            Warehouse = "Бар",
            Responsible = "Мария Смирнова",
            StartedAt = DateTime.UtcNow.AddDays(-1),
            Status = InventoryDocumentStatuses.InProgress,
            Items = sampleItems.Select((item, index) =>
            {
                var expected = 5m + index * 2;
                var counted = expected;
                return new InventoryLine
                {
                    CatalogItemId = item.Id,
                    Sku = item.Code,
                    ItemName = item.Name,
                    Category = item.Category,
                    ExpectedQuantity = Math.Max(0m, expected),
                    CountedQuantity = Math.Max(0m, counted),
                    Unit = item.Unit,
                    UnitPrice = Math.Max(0m, Convert.ToDecimal(item.UnitPrice)),
                };
            }).ToList(),
        };

        await context.InventoryDocuments.AddRangeAsync(
            new[] { completedDocument, draftDocument }, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static CatalogItem CloneCatalogItem(CatalogItem item)
    {
        return new CatalogItem
        {
            Id = item.Id,
            Name = item.Name,
            Type = item.Type,
            Code = item.Code,
            Category = item.Category,
            Unit = item.Unit,
            Weight = item.Weight,
            WriteoffMethod = item.WriteoffMethod,
            Allergens = item.Allergens,
            PackagingRequired = item.PackagingRequired,
            SpoilsAfterOpening = item.SpoilsAfterOpening,
            Supplier = item.Supplier,
            DeliveryTime = item.DeliveryTime,
            CostEstimate = item.CostEstimate,
            TaxRate = item.TaxRate,
            UnitPrice = item.UnitPrice,
            SalePrice = item.SalePrice,
            Tnved = item.Tnved,
            IsMarked = item.IsMarked,
            IsAlcohol = item.IsAlcohol,
            AlcoholCode = item.AlcoholCode,
            AlcoholStrength = item.AlcoholStrength,
            AlcoholVolume = item.AlcoholVolume
        };
    }
}
