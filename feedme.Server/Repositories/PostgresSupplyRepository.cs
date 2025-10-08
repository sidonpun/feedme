using System.Data;
using System.Globalization;
using feedme.Server.Data;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Repositories;

public sealed partial class PostgresSupplyRepository(AppDbContext context, ILogger<PostgresSupplyRepository> logger)
    : ISupplyRepository
{
    private readonly AppDbContext _context = context;
    private readonly ILogger<PostgresSupplyRepository> _logger = logger;

    private const int DefaultLimit = 50;

    public async Task<IReadOnlyCollection<Supply>> GetLatestAsync(int limit, CancellationToken cancellationToken = default)
    {
        var normalizedLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, 200);
        Log.RequestingSupplies(_logger, normalizedLimit);

        try
        {
            var supplies = await _context.Supplies
                .Include(supply => supply.CatalogItem)
                .AsNoTracking()
                .OrderByDescending(supply => supply.ArrivalDate)
                .ThenByDescending(supply => supply.CreatedAt)
                .Take(normalizedLimit)
                .ToListAsync(cancellationToken);

            Log.SuppliesRetrieved(_logger, supplies.Count);
            return supplies;
        }
        catch (Exception exception)
        {
            Log.SuppliesRetrievalFailed(_logger, exception);
            throw;
        }
    }

    public async Task<Supply> AddAsync(Supply supply, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(supply);
        Log.CreatingSupply(_logger, supply.Id);

        try
        {
            var normalized = await NormalizeAsync(supply, cancellationToken);

            _context.Supplies.Add(normalized);
            await _context.SaveChangesAsync(cancellationToken);

            var created = await _context.Supplies
                .Include(entity => entity.CatalogItem)
                .AsNoTracking()
                .SingleAsync(entity => entity.Id == normalized.Id, cancellationToken);

            Log.SupplyCreated(_logger, created.Id);
            return created;
        }
        catch (Exception exception)
        {
            Log.SupplyCreationFailed(_logger, supply.Id, exception);
            throw;
        }
    }

    private async Task<Supply> NormalizeAsync(Supply supply, CancellationToken cancellationToken)
    {
        var identifier = NormalizeIdentifier(supply.Id);
        var catalogItemId = NormalizeIdentifier(supply.CatalogItemId);
        var warehouse = Sanitize(supply.Warehouse, 128);
        var responsible = Sanitize(supply.Responsible, 128);
        var status = Sanitize(supply.Status, 32);

        if (string.IsNullOrWhiteSpace(status))
        {
            status = ShelfLifeState.Ok.ToCode();
        }

        var arrivalDate = NormalizeDate(supply.ArrivalDate);
        var expiryDate = NormalizeNullableDate(supply.ExpiryDate);

        if (expiryDate.HasValue && expiryDate.Value < arrivalDate)
        {
            throw new InvalidOperationException("Expiry date cannot precede arrival date.");
        }

        var documentNumber = Sanitize(supply.DocumentNumber, 32);
        if (string.IsNullOrEmpty(documentNumber))
        {
            documentNumber = await GenerateDocumentNumberAsync(cancellationToken);
        }

        var quantity = NormalizeQuantity(supply.Quantity);

        var createdAt = NormalizeTimestamp(supply.CreatedAt);
        if (createdAt == default)
        {
            createdAt = DateTime.UtcNow;
        }

        return new Supply
        {
            Id = identifier,
            DocumentNumber = documentNumber,
            CatalogItemId = catalogItemId,
            Quantity = quantity,
            ArrivalDate = arrivalDate,
            ExpiryDate = expiryDate,
            Warehouse = warehouse,
            Responsible = responsible,
            Status = status,
            CreatedAt = createdAt,
        };
    }

    private static string NormalizeIdentifier(string? value) =>
        string.IsNullOrWhiteSpace(value) ? Guid.NewGuid().ToString() : value.Trim();

    private static decimal NormalizeQuantity(decimal value)
    {
        if (value <= 0)
        {
            throw new InvalidOperationException("Quantity must be greater than zero.");
        }

        return Math.Round(value, 3, MidpointRounding.AwayFromZero);
    }

    private static DateTime NormalizeDate(DateTime value)
    {
        if (value == default)
        {
            return DateTime.UtcNow.Date;
        }

        var date = value.Date;
        return DateTime.SpecifyKind(date, DateTimeKind.Utc);
    }

    private static DateTime? NormalizeNullableDate(DateTime? value)
    {
        if (value is null)
        {
            return null;
        }

        return NormalizeDate(value.Value);
    }

    private static DateTime NormalizeTimestamp(DateTime value)
    {
        if (value == default)
        {
            return DateTime.UtcNow;
        }

        return value.Kind switch
        {
            DateTimeKind.Local => value.ToUniversalTime(),
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            _ => value,
        };
    }

    private static string Sanitize(string value, int maxLength)
    {
        if (maxLength <= 0)
        {
            return string.Empty;
        }

        var sanitized = value?.Trim() ?? string.Empty;
        if (sanitized.Length <= maxLength)
        {
            return sanitized;
        }

        var stringInfo = new StringInfo(sanitized);
        var length = Math.Min(maxLength, stringInfo.LengthInTextElements);
        return stringInfo.SubstringByTextElements(0, length);
    }

    private async Task<string> GenerateDocumentNumberAsync(CancellationToken cancellationToken)
    {
        if (!_context.Database.IsRelational())
        {
            var suffix = Guid.NewGuid().ToString("N", CultureInfo.InvariantCulture)[..6];
            var today = DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            return $"SUP-{today}-{suffix}";
        }

        var connection = _context.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT nextval('supplies_document_number_seq')";

        if (command.Connection?.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            var result = await command.ExecuteScalarAsync(cancellationToken);
            var sequence = Convert.ToInt64(result, CultureInfo.InvariantCulture);
            var today = DateTime.UtcNow.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
            return $"SUP-{today}-{sequence:D6}";
        }
        finally
        {
            if (connection.State == ConnectionState.Open)
            {
                await connection.CloseAsync();
            }
        }
    }

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving up to {Limit} supplies from the database.")]
        public static partial void RequestingSupplies(ILogger logger, int limit);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Retrieved {Count} supplies from the database.")]
        public static partial void SuppliesRetrieved(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve supplies from the database.")]
        public static partial void SuppliesRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Information, Message = "Creating supply '{SupplyId}'.")]
        public static partial void CreatingSupply(ILogger logger, string SupplyId);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Supply '{SupplyId}' was created in the database.")]
        public static partial void SupplyCreated(ILogger logger, string SupplyId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Error, Message = "Failed to create supply '{SupplyId}'.")]
        public static partial void SupplyCreationFailed(ILogger logger, string SupplyId, Exception exception);
    }
}
