using feedme.Server.Data;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Repositories;

public partial class PostgresInventoryRepository(AppDbContext context, ILogger<PostgresInventoryRepository> logger) : IInventoryRepository
{
    private readonly AppDbContext _context = context;
    private readonly ILogger<PostgresInventoryRepository> _logger = logger;

    private static class InventoryConstraints
    {
        public const int NumberMaxLength = 64;
        public const int WarehouseMaxLength = 128;
        public const int ResponsibleMaxLength = 128;
        public const int StatusMaxLength = 32;

        public const int CatalogItemIdMaxLength = 64;
        public const int SkuMaxLength = 64;
        public const int ItemNameMaxLength = 128;
        public const int CategoryMaxLength = 128;
        public const int UnitMaxLength = 32;
    }

    public async Task<IEnumerable<InventoryDocument>> GetAllAsync()
    {
        Log.RequestingInventories(_logger);

        try
        {
            var documents = await _context.InventoryDocuments
                .Include(document => document.Items)
                .AsNoTracking()
                .OrderByDescending(document => document.StartedAt)
                .ThenBy(document => document.Number)
                .ToListAsync();

            Log.InventoriesRetrieved(_logger, documents.Count);

            return documents;
        }
        catch (Exception exception)
        {
            Log.InventoriesRetrievalFailed(_logger, exception);
            throw;
        }
    }

    public async Task<InventoryDocument?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            Log.MissingIdentifier(_logger);
            return null;
        }

        var normalizedId = id.Trim();

        Log.RequestingInventory(_logger, normalizedId);

        try
        {
            var document = await _context.InventoryDocuments
                .Include(d => d.Items)
                .AsNoTracking()
                .SingleOrDefaultAsync(d => d.Id == normalizedId);

            if (document is null)
            {
                Log.InventoryNotFound(_logger, normalizedId);
            }
            else
            {
                Log.InventoryRetrieved(_logger, normalizedId);
            }

            return document;
        }
        catch (Exception exception)
        {
            Log.InventoryRetrievalFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    public async Task<InventoryDocument> AddAsync(InventoryDocument document)
    {
        var normalized = NormalizeDocument(document);

        Log.CreatingInventory(_logger, normalized.Id);

        try
        {
            _context.InventoryDocuments.Add(normalized);
            await _context.SaveChangesAsync();

            Log.InventoryCreated(_logger, normalized.Id);

            return (await GetByIdAsync(normalized.Id))!;
        }
        catch (Exception exception)
        {
            Log.InventoryCreationFailed(_logger, normalized.Id, exception);
            throw;
        }
    }

    public async Task<InventoryDocument?> UpdateAsync(InventoryDocument document)
    {
        var normalized = NormalizeDocument(document);

        Log.UpdatingInventory(_logger, normalized.Id);

        try
        {
            var existing = await _context.InventoryDocuments
                .Include(d => d.Items)
                .SingleOrDefaultAsync(d => d.Id == normalized.Id);

            if (existing is null)
            {
                Log.InventoryNotFound(_logger, normalized.Id);
                return null;
            }

            existing.Number = normalized.Number;
            existing.Warehouse = normalized.Warehouse;
            existing.Responsible = normalized.Responsible;
            existing.StartedAt = normalized.StartedAt;
            existing.CompletedAt = normalized.CompletedAt;
            existing.Status = normalized.Status;

            existing.Items.Clear();
            foreach (var item in normalized.Items)
            {
                existing.Items.Add(item);
            }

            await _context.SaveChangesAsync();

            Log.InventoryUpdated(_logger, normalized.Id);

            return (await GetByIdAsync(existing.Id))!;
        }
        catch (Exception exception)
        {
            Log.InventoryUpdateFailed(_logger, normalized.Id, exception);
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

        Log.DeletingInventory(_logger, normalizedId);

        try
        {
            var entity = await _context.InventoryDocuments
                .Include(d => d.Items)
                .SingleOrDefaultAsync(d => d.Id == normalizedId);

            if (entity is null)
            {
                Log.InventoryNotFound(_logger, normalizedId);
                return false;
            }

            _context.InventoryDocuments.Remove(entity);
            await _context.SaveChangesAsync();

            Log.InventoryDeleted(_logger, normalizedId);

            return true;
        }
        catch (Exception exception)
        {
            Log.InventoryDeletionFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    private static InventoryDocument NormalizeDocument(InventoryDocument document)
    {
        var normalized = new InventoryDocument
        {
            Id = NormalizeIdentifier(document.Id),
            Number = NormalizeNumber(document.Number),
            Warehouse = Sanitize(document.Warehouse, InventoryConstraints.WarehouseMaxLength, "Главный склад"),
            Responsible = Sanitize(document.Responsible, InventoryConstraints.ResponsibleMaxLength, "Не назначен"),
            StartedAt = NormalizeTimestamp(document.StartedAt),
            CompletedAt = NormalizeNullableTimestamp(document.CompletedAt),
            Status = NormalizeStatus(document.Status),
        };

        var items = (document.Items ?? Enumerable.Empty<InventoryLine>())
            .Where(item => item is not null)
            .Select(NormalizeLine)
            .ToList();

        normalized.Items.Clear();
        normalized.Items.AddRange(items);

        if (normalized.Items.Count == 0)
        {
            throw new InvalidOperationException("Inventory document must contain at least one item.");
        }

        return normalized;
    }

    private static InventoryLine NormalizeLine(InventoryLine item)
    {
        return new InventoryLine
        {
            CatalogItemId = Sanitize(item.CatalogItemId, InventoryConstraints.CatalogItemIdMaxLength, "unknown"),
            Sku = Sanitize(item.Sku, InventoryConstraints.SkuMaxLength, "—"),
            ItemName = Sanitize(item.ItemName, InventoryConstraints.ItemNameMaxLength, "Без названия"),
            Category = Sanitize(item.Category, InventoryConstraints.CategoryMaxLength, "Без категории"),
            ExpectedQuantity = ClampNonNegative(item.ExpectedQuantity),
            CountedQuantity = ClampNonNegative(item.CountedQuantity),
            Unit = Sanitize(item.Unit, InventoryConstraints.UnitMaxLength, "шт"),
            UnitPrice = ClampNonNegative(item.UnitPrice),
        };
    }

    private static string NormalizeIdentifier(string? value) =>
        string.IsNullOrWhiteSpace(value) ? Guid.NewGuid().ToString() : value.Trim();

    private static string NormalizeNumber(string? value)
    {
        var sanitized = Sanitize(value, InventoryConstraints.NumberMaxLength);
        if (!string.IsNullOrWhiteSpace(sanitized))
        {
            return sanitized;
        }

        return $"INV-{Guid.NewGuid():N}"[..12].ToUpperInvariant();
    }

    private static string NormalizeStatus(string? value)
    {
        var sanitized = Sanitize(value, InventoryConstraints.StatusMaxLength);
        return InventoryDocumentStatuses.Normalize(sanitized);
    }

    private static string Sanitize(string? value, int maxLength, string fallback = "")
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return fallback;
        }

        var trimmed = value.Trim();
        if (trimmed.Length <= maxLength)
        {
            return trimmed;
        }

        return trimmed[..maxLength];
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
            _ => timestamp,
        };
    }

    private static DateTime? NormalizeNullableTimestamp(DateTime? timestamp)
    {
        if (timestamp is null)
        {
            return null;
        }

        return NormalizeTimestamp(timestamp.Value);
    }

    private static decimal ClampNonNegative(decimal value) => value < 0 ? 0 : decimal.Round(value, 4, MidpointRounding.AwayFromZero);

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving all inventory documents.")]
        public static partial void RequestingInventories(ILogger logger);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Retrieved {Count} inventory documents.")]
        public static partial void InventoriesRetrieved(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve inventory documents.")]
        public static partial void InventoriesRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Inventory identifier is missing or empty.")]
        public static partial void MissingIdentifier(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Retrieving inventory document '{InventoryId}'.")]
        public static partial void RequestingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Warning, Message = "Inventory document '{InventoryId}' was not found.")]
        public static partial void InventoryNotFound(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was retrieved successfully.")]
        public static partial void InventoryRetrieved(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Error, Message = "Failed to retrieve inventory document '{InventoryId}'.")]
        public static partial void InventoryRetrievalFailed(ILogger logger, string inventoryId, Exception exception);

        [LoggerMessage(EventId = 9, Level = LogLevel.Information, Message = "Creating inventory document '{InventoryId}'.")]
        public static partial void CreatingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was created successfully.")]
        public static partial void InventoryCreated(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 11, Level = LogLevel.Error, Message = "Failed to create inventory document '{InventoryId}'.")]
        public static partial void InventoryCreationFailed(ILogger logger, string inventoryId, Exception exception);

        [LoggerMessage(EventId = 12, Level = LogLevel.Information, Message = "Updating inventory document '{InventoryId}'.")]
        public static partial void UpdatingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 13, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was updated successfully.")]
        public static partial void InventoryUpdated(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 14, Level = LogLevel.Error, Message = "Failed to update inventory document '{InventoryId}'.")]
        public static partial void InventoryUpdateFailed(ILogger logger, string inventoryId, Exception exception);

        [LoggerMessage(EventId = 15, Level = LogLevel.Information, Message = "Deleting inventory document '{InventoryId}'.")]
        public static partial void DeletingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 16, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was deleted successfully.")]
        public static partial void InventoryDeleted(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 17, Level = LogLevel.Error, Message = "Failed to delete inventory document '{InventoryId}'.")]
        public static partial void InventoryDeletionFailed(ILogger logger, string inventoryId, Exception exception);
    }
}
