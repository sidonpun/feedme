using feedme.Server.Data;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace feedme.Server.Repositories;

public class PostgresCatalogRepository(AppDbContext context) : ICatalogRepository
{
    private readonly AppDbContext _context = context;

    public async Task<IEnumerable<CatalogItem>> GetAllAsync()
    {
        return await _context.CatalogItems
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .ToListAsync();
    }

    public async Task<CatalogItem?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        return await _context.CatalogItems
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id);
    }

    public async Task<CatalogItem> AddAsync(CatalogItem item)
    {
        var normalized = Normalize(item);

        _context.CatalogItems.Add(normalized);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(normalized.Id))!;
    }

    private static CatalogItem Normalize(CatalogItem item)
    {
        if (item is null)
        {
            throw new ArgumentNullException(nameof(item));
        }

        var id = string.IsNullOrWhiteSpace(item.Id)
            ? Guid.NewGuid().ToString()
            : item.Id.Trim();

        return new CatalogItem
        {
            Id = id,
            Name = Sanitize(item.Name),
            Type = Sanitize(item.Type),
            Code = Sanitize(item.Code),
            Category = Sanitize(item.Category),
            Unit = Sanitize(item.Unit),
            Weight = item.Weight,
            WriteoffMethod = Sanitize(item.WriteoffMethod),
            Allergens = Sanitize(item.Allergens),
            PackagingRequired = item.PackagingRequired,
            SpoilsAfterOpening = item.SpoilsAfterOpening,
            Supplier = Sanitize(item.Supplier),
            DeliveryTime = item.DeliveryTime,
            CostEstimate = item.CostEstimate,
            TaxRate = Sanitize(item.TaxRate),
            UnitPrice = item.UnitPrice,
            SalePrice = item.SalePrice,
            Tnved = Sanitize(item.Tnved),
            IsMarked = item.IsMarked,
            IsAlcohol = item.IsAlcohol,
            AlcoholCode = Sanitize(item.AlcoholCode),
            AlcoholStrength = item.AlcoholStrength,
            AlcoholVolume = item.AlcoholVolume
        };
    }

    private static string Sanitize(string value) => value?.Trim() ?? string.Empty;
}
