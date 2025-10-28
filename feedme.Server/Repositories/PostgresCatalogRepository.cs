using System;
using System.Collections.Generic;
using System.Linq;
using feedme.Server.Data;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Repositories;

public partial class PostgresCatalogRepository(AppDbContext context, ILogger<PostgresCatalogRepository> logger) : ICatalogRepository
{
    private readonly AppDbContext _context = context;
    private readonly ILogger<PostgresCatalogRepository> _logger = logger;

    public async Task<IEnumerable<CatalogItem>> GetAllAsync()
    {
        Log.RequestingCatalogItems(_logger);

        try
        {
            var items = await _context.CatalogItems
                .Include(item => item.Flags)
                .AsNoTracking()
                .OrderBy(item => item.Name)
                .ToListAsync();

            Log.CatalogItemsRetrieved(_logger, items.Count);

            return items;
        }
        catch (Exception exception)
        {
            Log.CatalogItemsRetrievalFailed(_logger, exception);
            throw;
        }
    }

    public async Task<CatalogItem?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            Log.MissingIdentifier(_logger);
            return null;
        }

        Log.RequestingCatalogItem(_logger, id);

        try
        {
            var item = await _context.CatalogItems
                .Include(item => item.Flags)
                .AsNoTracking()
                .SingleOrDefaultAsync(item => item.Id == id);

            if (item is null)
            {
                Log.CatalogItemNotFound(_logger, id);
            }
            else
            {
                Log.CatalogItemRetrieved(_logger, id);
            }

            return item;
        }
        catch (Exception exception)
        {
            Log.CatalogItemRetrievalFailed(_logger, id, exception);
            throw;
        }
    }

    public async Task<CatalogItem> AddAsync(CatalogItem item)
    {
        var normalized = await NormalizeAsync(item).ConfigureAwait(false);

        Log.CreatingCatalogItem(_logger, normalized.Id);

        try
        {
            _context.CatalogItems.Add(normalized);
            await _context.SaveChangesAsync();

            Log.CatalogItemCreated(_logger, normalized.Id);

            return (await GetByIdAsync(normalized.Id))!;
        }
        catch (Exception exception)
        {
            Log.CatalogItemCreationFailed(_logger, normalized.Id, exception);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            Log.MissingIdentifier(_logger);
            return false;
        }

        var normalizedId = id.Trim();

        Log.DeletingCatalogItem(_logger, normalizedId);

        try
        {
            var existingItem = await _context.CatalogItems
                .SingleOrDefaultAsync(item => item.Id == normalizedId);

            if (existingItem is null)
            {
                Log.CatalogItemNotFound(_logger, normalizedId);
                return false;
            }

            _context.CatalogItems.Remove(existingItem);
            await _context.SaveChangesAsync();

            Log.CatalogItemDeleted(_logger, normalizedId);

            return true;
        }
        catch (Exception exception)
        {
            Log.CatalogItemDeletionFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    private async Task<CatalogItem> NormalizeAsync(CatalogItem item)
    {
        ArgumentNullException.ThrowIfNull(item);

        var id = string.IsNullOrWhiteSpace(item.Id)
            ? Guid.NewGuid().ToString()
            : item.Id.Trim();

        var normalized = new CatalogItem
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

        var resolvedFlags = await ResolveFlagsAsync(item.Flags).ConfigureAwait(false);
        foreach (var flag in resolvedFlags)
        {
            normalized.Flags.Add(flag);
        }

        return normalized;
    }

    private async Task<IReadOnlyCollection<ProductFlag>> ResolveFlagsAsync(IEnumerable<ProductFlag>? flags)
    {
        if (flags is null)
        {
            return Array.Empty<ProductFlag>();
        }

        var codes = flags
            .Select(flag => flag?.Code)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code!.Trim().ToLowerInvariant())
            .Distinct()
            .ToArray();

        if (codes.Length == 0)
        {
            return Array.Empty<ProductFlag>();
        }

        var candidates = await _context.ProductFlags
            .Where(flag => codes.Contains(flag.Code))
            .ToListAsync()
            .ConfigureAwait(false);

        var orderMap = codes
            .Select((code, index) => new { code, index })
            .ToDictionary(entry => entry.code, entry => entry.index, StringComparer.Ordinal);

        return candidates
            .OrderBy(flag => orderMap.TryGetValue(flag.Code, out var index) ? index : int.MaxValue)
            .ToArray();
    }

    private static string Sanitize(string value) => value?.Trim() ?? string.Empty;

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving catalog items from the database.")]
        public static partial void RequestingCatalogItems(ILogger logger);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Retrieved {Count} catalog items from the database.")]
        public static partial void CatalogItemsRetrieved(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve catalog items from the database.")]
        public static partial void CatalogItemsRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Catalog item identifier is missing.")]
        public static partial void MissingIdentifier(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Retrieving catalog item '{CatalogItemId}' from the database.")]
        public static partial void RequestingCatalogItem(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Warning, Message = "Catalog item '{CatalogItemId}' was not found in the database.")]
        public static partial void CatalogItemNotFound(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Information, Message = "Catalog item '{CatalogItemId}' was retrieved from the database.")]
        public static partial void CatalogItemRetrieved(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Error, Message = "Failed to retrieve catalog item '{CatalogItemId}' from the database.")]
        public static partial void CatalogItemRetrievalFailed(ILogger logger, string catalogItemId, Exception exception);

        [LoggerMessage(EventId = 9, Level = LogLevel.Information, Message = "Creating catalog item '{CatalogItemId}'.")]
        public static partial void CreatingCatalogItem(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "Catalog item '{CatalogItemId}' was created in the database.")]
        public static partial void CatalogItemCreated(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 11, Level = LogLevel.Error, Message = "Failed to create catalog item '{CatalogItemId}'.")]
        public static partial void CatalogItemCreationFailed(ILogger logger, string catalogItemId, Exception exception);

        [LoggerMessage(EventId = 12, Level = LogLevel.Information, Message = "Deleting catalog item '{CatalogItemId}'.")]
        public static partial void DeletingCatalogItem(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 13, Level = LogLevel.Information, Message = "Catalog item '{CatalogItemId}' was deleted from the database.")]
        public static partial void CatalogItemDeleted(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 14, Level = LogLevel.Error, Message = "Failed to delete catalog item '{CatalogItemId}'.")]
        public static partial void CatalogItemDeletionFailed(ILogger logger, string catalogItemId, Exception exception);
    }
}
