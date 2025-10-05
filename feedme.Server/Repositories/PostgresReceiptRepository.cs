using feedme.Server.Data;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Repositories;

public partial class PostgresReceiptRepository(AppDbContext context, ILogger<PostgresReceiptRepository> logger) : IReceiptRepository
{
    private readonly AppDbContext _context = context;
    private readonly ILogger<PostgresReceiptRepository> _logger = logger;

    public async Task<IEnumerable<Receipt>> GetAllAsync()
    {
        Log.RequestingReceipts(_logger);

        try
        {
            var receipts = await _context.Receipts
                .Include(receipt => receipt.Items)
                .AsNoTracking()
                .OrderByDescending(receipt => receipt.ReceivedAt)
                .ToListAsync();

            Log.ReceiptsRetrieved(_logger, receipts.Count);

            return receipts;
        }
        catch (Exception exception)
        {
            Log.ReceiptsRetrievalFailed(_logger, exception);
            throw;
        }
    }

    public async Task<Receipt?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            Log.MissingIdentifier(_logger);
            return null;
        }

        Log.RequestingReceipt(_logger, id);

        try
        {
            var receipt = await _context.Receipts
                .Include(receipt => receipt.Items)
                .AsNoTracking()
                .SingleOrDefaultAsync(receipt => receipt.Id == id);

            if (receipt is null)
            {
                Log.ReceiptNotFound(_logger, id);
            }
            else
            {
                Log.ReceiptRetrieved(_logger, id);
            }

            return receipt;
        }
        catch (Exception exception)
        {
            Log.ReceiptRetrievalFailed(_logger, id, exception);
            throw;
        }
    }

    public async Task<Receipt> AddAsync(Receipt receipt)
    {
        var normalized = NormalizeReceipt(receipt);

        Log.CreatingReceipt(_logger, normalized.Id);

        try
        {
            _context.Receipts.Add(normalized);
            await _context.SaveChangesAsync();

            Log.ReceiptCreated(_logger, normalized.Id);

            return (await GetByIdAsync(normalized.Id))!;
        }
        catch (Exception exception)
        {
            Log.ReceiptCreationFailed(_logger, normalized.Id, exception);
            throw;
        }
    }

    public async Task<Receipt?> UpdateAsync(Receipt receipt)
    {
        var normalized = NormalizeReceipt(receipt);

        Log.UpdatingReceipt(_logger, normalized.Id);

        try
        {
            var existing = await _context.Receipts
                .Include(r => r.Items)
                .SingleOrDefaultAsync(r => r.Id == normalized.Id);

            if (existing is null)
            {
                Log.ReceiptNotFound(_logger, normalized.Id);
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

            Log.ReceiptUpdated(_logger, normalized.Id);

            return (await GetByIdAsync(existing.Id))!;
        }
        catch (Exception exception)
        {
            Log.ReceiptUpdateFailed(_logger, normalized.Id, exception);
            throw;
        }
    }

    public async Task<bool> RemoveAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            Log.MissingIdentifier(_logger);
            return false;
        }

        var normalizedId = id.Trim();

        Log.DeletingReceipt(_logger, normalizedId);

        try
        {
            var receipt = await _context.Receipts.FindAsync(normalizedId);
            if (receipt is null)
            {
                Log.ReceiptNotFound(_logger, normalizedId);
                return false;
            }

            _context.Receipts.Remove(receipt);
            await _context.SaveChangesAsync();

            Log.ReceiptDeleted(_logger, normalizedId);

            return true;
        }
        catch (Exception exception)
        {
            Log.ReceiptDeletionFailed(_logger, normalizedId, exception);
            throw;
        }
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

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving receipts from the database.")]
        public static partial void RequestingReceipts(ILogger logger);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Retrieved {Count} receipts from the database.")]
        public static partial void ReceiptsRetrieved(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve receipts from the database.")]
        public static partial void ReceiptsRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Receipt identifier is missing.")]
        public static partial void MissingIdentifier(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Retrieving receipt '{ReceiptId}' from the database.")]
        public static partial void RequestingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Warning, Message = "Receipt '{ReceiptId}' was not found in the database.")]
        public static partial void ReceiptNotFound(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Information, Message = "Receipt '{ReceiptId}' was retrieved from the database.")]
        public static partial void ReceiptRetrieved(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Error, Message = "Failed to retrieve receipt '{ReceiptId}' from the database.")]
        public static partial void ReceiptRetrievalFailed(ILogger logger, string receiptId, Exception exception);

        [LoggerMessage(EventId = 9, Level = LogLevel.Information, Message = "Creating receipt '{ReceiptId}'.")]
        public static partial void CreatingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "Receipt '{ReceiptId}' was created in the database.")]
        public static partial void ReceiptCreated(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 11, Level = LogLevel.Error, Message = "Failed to create receipt '{ReceiptId}'.")]
        public static partial void ReceiptCreationFailed(ILogger logger, string receiptId, Exception exception);

        [LoggerMessage(EventId = 12, Level = LogLevel.Information, Message = "Updating receipt '{ReceiptId}'.")]
        public static partial void UpdatingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 13, Level = LogLevel.Information, Message = "Receipt '{ReceiptId}' was updated in the database.")]
        public static partial void ReceiptUpdated(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 14, Level = LogLevel.Error, Message = "Failed to update receipt '{ReceiptId}'.")]
        public static partial void ReceiptUpdateFailed(ILogger logger, string receiptId, Exception exception);

        [LoggerMessage(EventId = 15, Level = LogLevel.Information, Message = "Deleting receipt '{ReceiptId}'.")]
        public static partial void DeletingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 16, Level = LogLevel.Information, Message = "Receipt '{ReceiptId}' was deleted from the database.")]
        public static partial void ReceiptDeleted(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 17, Level = LogLevel.Error, Message = "Failed to delete receipt '{ReceiptId}'.")]
        public static partial void ReceiptDeletionFailed(ILogger logger, string receiptId, Exception exception);
    }
}
