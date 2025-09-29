using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace feedme.Server.Data.Seed;

internal static class AppDbContextSeeder
{
    public static async Task SeedAsync(AppDbContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        await SeedCatalogItemsAsync(context, cancellationToken).ConfigureAwait(false);
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
