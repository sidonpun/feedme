using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using feedme.Server.Models;

namespace feedme.Server.Repositories;

public class InMemoryReceiptRepository : IReceiptRepository
{
    private readonly ConcurrentDictionary<string, Receipt> _receipts = new();

    public Task<IEnumerable<Receipt>> GetAllAsync()
    {
        var receipts = _receipts.Values
            .OrderBy(receipt => receipt.ReceivedAt)
            .Select(CloneReceipt)
            .ToList();

        return Task.FromResult<IEnumerable<Receipt>>(receipts);
    }

    public Task<Receipt?> GetByIdAsync(string id)
    {
        if (!_receipts.TryGetValue(id, out var receipt))
        {
            return Task.FromResult<Receipt?>(null);
        }

        return Task.FromResult<Receipt?>(CloneReceipt(receipt));
    }

    public Task<Receipt> AddAsync(Receipt receipt)
    {
        var normalized = NormalizeReceipt(receipt);
        _receipts[normalized.Id] = normalized;

        return Task.FromResult(CloneReceipt(normalized));
    }

    private static Receipt NormalizeReceipt(Receipt receipt)
    {
        var id = string.IsNullOrWhiteSpace(receipt.Id) ? Guid.NewGuid().ToString() : receipt.Id;
        var receivedAt = NormalizeTimestamp(receipt.ReceivedAt);

        var items = (receipt.Items ?? new List<ReceiptLine>())
            .Select(item => new ReceiptLine
            {
                CatalogItemId = Sanitize(item.CatalogItemId),
                ItemName = Sanitize(item.ItemName),
                Quantity = item.Quantity,
                Unit = Sanitize(item.Unit),
                UnitPrice = item.UnitPrice
            })
            .ToList();

        var normalized = new Receipt
        {
            Id = id,
            Number = Sanitize(receipt.Number),
            Supplier = Sanitize(receipt.Supplier),
            Warehouse = Sanitize(receipt.Warehouse),
            ReceivedAt = receivedAt,
            Items = items
        };

        return normalized;
    }

    private static Receipt CloneReceipt(Receipt receipt)
    {
        return new Receipt
        {
            Id = receipt.Id,
            Number = receipt.Number,
            Supplier = receipt.Supplier,
            Warehouse = receipt.Warehouse,
            ReceivedAt = receipt.ReceivedAt,
            Items = receipt.Items
                .Select(item => new ReceiptLine
                {
                    CatalogItemId = item.CatalogItemId,
                    ItemName = item.ItemName,
                    Quantity = item.Quantity,
                    Unit = item.Unit,
                    UnitPrice = item.UnitPrice
                })
                .ToList()
        };
    }

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
}
