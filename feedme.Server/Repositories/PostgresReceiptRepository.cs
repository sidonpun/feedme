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
            .OrderByDescending(receipt => receipt.ReceivedAt)
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

    public async Task<Receipt?> UpdateAsync(Receipt receipt)
    {
        var normalized = NormalizeReceipt(receipt);

        var existing = await _context.Receipts
            .Include(r => r.Items)
            .SingleOrDefaultAsync(r => r.Id == normalized.Id);

        if (existing is null)
        {
            return null;
        }

        existing.Number = normalized.Number;
        existing.Supplier = normalized.Supplier;
        existing.Warehouse = normalized.Warehouse;
        existing.Responsible = normalized.Responsible;
        existing.ReceivedAt = normalized.ReceivedAt;

        existing.Items.Clear();
        foreach (var item in normalized.Items)
        {
            existing.Items.Add(item);
        }

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(existing.Id))!;
    }

    public async Task<bool> RemoveAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return false;
        }

        var receipt = await _context.Receipts.FindAsync(id);
        if (receipt is null)
        {
            return false;
        }

        _context.Receipts.Remove(receipt);
        await _context.SaveChangesAsync();

        return true;
    }

    private static Receipt NormalizeReceipt(Receipt receipt)
    {
        if (receipt is null)
        {
            throw new ArgumentNullException(nameof(receipt));
        }

        var normalized = new Receipt
        {
            Id = NormalizeIdentifier(receipt.Id),
            Number = Sanitize(receipt.Number),
            Supplier = Sanitize(receipt.Supplier),
            Warehouse = Sanitize(receipt.Warehouse),
            Responsible = Sanitize(receipt.Responsible),
            ReceivedAt = NormalizeTimestamp(receipt.ReceivedAt),
            Items = (receipt.Items ?? new List<ReceiptLine>())
                .Select(NormalizeItem)
                .ToList()
        };

        return normalized;
    }

    private static ReceiptLine NormalizeItem(ReceiptLine item)
    {
        var status = Sanitize(item.Status);
        if (string.IsNullOrEmpty(status))
        {
            status = ShelfLifeState.Ok.ToCode();
        }

        return new ReceiptLine
        {
            CatalogItemId = Sanitize(item.CatalogItemId),
            Sku = Sanitize(item.Sku),
            ItemName = Sanitize(item.ItemName),
            Category = Sanitize(item.Category),
            Quantity = item.Quantity,
            Unit = Sanitize(item.Unit),
            UnitPrice = item.UnitPrice,
            ExpiryDate = NormalizeDate(item.ExpiryDate),
            Status = status
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

    private static string Sanitize(string value) => value?.Trim() ?? string.Empty;

    private static DateTime? NormalizeDate(DateTime? value)
    {
        if (value is null)
        {
            return null;
        }

        var date = value.Value.Date;

        return date.Kind switch
        {
            DateTimeKind.Unspecified => DateTime.SpecifyKind(date, DateTimeKind.Utc),
            DateTimeKind.Local => date.ToUniversalTime(),
            _ => date
        };
    }
}
