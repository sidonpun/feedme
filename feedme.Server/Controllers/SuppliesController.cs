using feedme.Server.Contracts;
using feedme.Server.Models;
using feedme.Server.Repositories;
using feedme.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class SuppliesController : ControllerBase
{
    private readonly ISupplyRepository _supplies;
    private readonly ICatalogRepository _catalog;
    private readonly ILogger<SuppliesController> _logger;

    private const int DefaultLimit = 50;

    public SuppliesController(
        ISupplyRepository supplies,
        ICatalogRepository catalog,
        ILogger<SuppliesController> logger)
    {
        _supplies = supplies;
        _catalog = catalog;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SupplyResponse>>> Get([FromQuery] int limit = DefaultLimit)
    {
        var normalizedLimit = limit <= 0 ? DefaultLimit : Math.Min(limit, 200);
        Log.RequestingSupplies(_logger, normalizedLimit);

        try
        {
            var supplies = await _supplies.GetLatestAsync(normalizedLimit, HttpContext.RequestAborted);
            var responses = supplies.Select(MapSupply).ToArray();
            Log.SuppliesReturned(_logger, responses.Length);
            return Ok(responses);
        }
        catch (Exception exception)
        {
            Log.SuppliesRetrievalFailed(_logger, exception);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<SupplyResponse>> Create([FromBody] CreateSupplyRequest request)
    {
        if (!ModelState.IsValid)
        {
            Log.InvalidSupplyPayload(_logger);
            return ValidationProblem(ModelState);
        }

        var catalogItemId = request.CatalogItemId?.Trim();
        if (string.IsNullOrWhiteSpace(catalogItemId))
        {
            Log.MissingCatalogItem(_logger);
            return ValidationProblem();
        }

        Log.CreatingSupply(_logger, catalogItemId);

        try
        {
            var catalogItem = await _catalog.GetByIdAsync(catalogItemId);
            if (catalogItem is null)
            {
                Log.CatalogItemNotFound(_logger, catalogItemId);
                return NotFound();
            }

            var arrivalDate = NormalizeDate(request.ArrivalDate);
            var expiryDate = NormalizeNullableDate(request.ExpiryDate);
            if (expiryDate.HasValue && expiryDate.Value < arrivalDate)
            {
                ModelState.AddModelError(nameof(request.ExpiryDate), "Expiry date cannot precede arrival date.");
                return ValidationProblem(ModelState);
            }

            var status = expiryDate.HasValue
                ? ShelfLifeStatusCalculator.Evaluate(arrivalDate, expiryDate.Value).ToCode()
                : ShelfLifeState.Ok.ToCode();

            var documentNumber = request.DocumentNumber?.Trim() ?? string.Empty;

            var supply = new Supply
            {
                CatalogItemId = catalogItem.Id,
                DocumentNumber = documentNumber,
                Quantity = request.Quantity,
                ArrivalDate = arrivalDate,
                ExpiryDate = expiryDate,
                Warehouse = string.IsNullOrWhiteSpace(request.Warehouse) ? "Главный склад" : request.Warehouse.Trim(),
                Responsible = string.IsNullOrWhiteSpace(request.Responsible) ? "Не назначен" : request.Responsible.Trim(),
                Status = status,
            };

            var created = await _supplies.AddAsync(supply, HttpContext.RequestAborted);
            var response = MapSupply(created);

            Log.SupplyCreated(_logger, response.Id);
            return CreatedAtAction(nameof(Get), new { id = response.Id }, response);
        }
        catch (Exception exception)
        {
            Log.SupplyCreationFailed(_logger, exception);
            throw;
        }
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

    private static SupplyResponse MapSupply(Supply supply)
    {
        var item = supply.CatalogItem
            ?? throw new InvalidOperationException("Supply must include its catalog item.");

        var unitPrice = Convert.ToDecimal(item.UnitPrice);

        return new SupplyResponse(
            supply.Id,
            supply.DocumentNumber,
            supply.ArrivalDate,
            supply.Warehouse,
            supply.Responsible,
            supply.CatalogItemId,
            item.Name,
            item.Code,
            item.Category,
            supply.Quantity,
            item.Unit,
            supply.ExpiryDate,
            item.Supplier,
            supply.Status,
            unitPrice,
            supply.CreatedAt);
    }

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving supplies (limit {Limit}).")]
        public static partial void RequestingSupplies(ILogger logger, int limit);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Returned {Count} supplies to the client.")]
        public static partial void SuppliesReturned(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve supplies.")]
        public static partial void SuppliesRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Create supply payload is invalid.")]
        public static partial void InvalidSupplyPayload(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Warning, Message = "Catalog item identifier is missing.")]
        public static partial void MissingCatalogItem(ILogger logger);

        [LoggerMessage(EventId = 6, Level = LogLevel.Information, Message = "Creating supply for catalog item '{CatalogItemId}'.")]
        public static partial void CreatingSupply(ILogger logger, string CatalogItemId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Warning, Message = "Catalog item '{CatalogItemId}' was not found.")]
        public static partial void CatalogItemNotFound(ILogger logger, string CatalogItemId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Information, Message = "Supply '{SupplyId}' created successfully.")]
        public static partial void SupplyCreated(ILogger logger, string SupplyId);

        [LoggerMessage(EventId = 9, Level = LogLevel.Error, Message = "Failed to create supply.")]
        public static partial void SupplyCreationFailed(ILogger logger, Exception exception);
    }
}
