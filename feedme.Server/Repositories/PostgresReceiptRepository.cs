using feedme.Server.Data;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace feedme.Server.Repositories;

public class PostgresReceiptRepository(AppDbContext context) : IReceiptRepository
{
    private readonly AppDbContext _context = context;

    public async Task<IEnumerable<Receipt>> GetAllAsync()
    {
        return await _context.Receipts
            .AsNoTracking()
            .OrderBy(receipt => receipt.ReceivedAt)
            .ToListAsync();
    }

    public async Task<Receipt?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        return await _context.Receipts
            .AsNoTracking()
            .SingleOrDefaultAsync(receipt => receipt.Id == id);
    }

    public async Task<Receipt> AddAsync(Receipt receipt)
    {
        var normalized = NormalizeReceipt(receipt);

        _context.Receipts.Add(normalized);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(normalized.Id))!;
    }

    private static Receipt NormalizeReceipt(Receipt receipt)
    {
        if (receipt is null)
        {
            throw new ArgumentNullException(nameof(receipt));
        }

        var items = receipt.Items ?? new List<ReceiptLine>();

        if (items.Any(item => item is null))
        {
            throw new ArgumentException("Receipt items cannot contain null entries.", nameof(Receipt.Items));
        }

        var normalized = new Receipt
        {
            Id = NormalizeIdentifier(receipt.Id),
            Number = Sanitize(receipt.Number),
            Supplier = Sanitize(receipt.Supplier),
            Warehouse = Sanitize(receipt.Warehouse),
            ReceivedAt = NormalizeTimestamp(receipt.ReceivedAt),
            Items = items
                .Select(NormalizeItem)
                .ToList()
        };

        return normalized;
    }

    private static ReceiptLine NormalizeItem(ReceiptLine item)
    {
        if (item is null)
        {
            throw new ArgumentNullException(nameof(item), "Receipt item cannot be null.");
        }

        return new ReceiptLine
        {
            CatalogItemId = Sanitize(item.CatalogItemId),
            ItemName = Sanitize(item.ItemName),
            Quantity = item.Quantity,
            Unit = Sanitize(item.Unit),
            UnitPrice = item.UnitPrice
        };
    }

    private static string NormalizeIdentifier(string? value) =>
        string.IsNullOrWhiteSpace(value) ? Guid.NewGuid().ToString() : value.Trim();

    private static DateTime NormalizeTimestamp(DateTime timestamp)
    {
        if (timestamp == default)
        {
            return DateTime.UtcNow;
        }

        return timestamp.Kind switch
        {
            DateTimeKind.Unspecified => DateTime.SpecifyKind(timestamp, DateTimeKind.Utc),
            DateTimeKind.Local => timestamp.ToUniversalTime(),
            _ => timestamp
        };
    }

    private static string Sanitize(string? value) => value?.Trim() ?? string.Empty;
}
