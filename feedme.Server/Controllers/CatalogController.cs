using feedme.Server.Models;
using feedme.Server.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class CatalogController : ControllerBase
{
    private readonly ICatalogRepository _repository;
    private readonly ILogger<CatalogController> _logger;

    public CatalogController(ICatalogRepository repository, ILogger<CatalogController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CatalogItem>>> Get()
    {
        Log.RequestingCatalogItems(_logger);

        try
        {
            var items = (await _repository.GetAllAsync()).ToArray();

            Log.CatalogItemsRetrieved(_logger, items.Length);

            return Ok(items);
        }
        catch (Exception exception)
        {
            Log.CatalogItemsRetrievalFailed(_logger, exception);
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CatalogItem>> GetById(string id)
    {
        var normalizedId = id?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedId))
        {
            Log.MissingCatalogItemIdentifier(_logger);
            return NotFound();
        }

        Log.RequestingCatalogItem(_logger, normalizedId);

        try
        {
            var item = await _repository.GetByIdAsync(normalizedId);

            if (item is null)
            {
                Log.CatalogItemNotFound(_logger, normalizedId);
                return NotFound();
            }

            Log.CatalogItemReturned(_logger, normalizedId);
            return Ok(item);
        }
        catch (Exception exception)
        {
            Log.CatalogItemRetrievalFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<CatalogItem>> Create([FromBody] CatalogItem item)
    {
        if (item is null)
        {
            Log.CatalogItemPayloadMissing(_logger);
            return BadRequest();
        }

        Log.CreatingCatalogItem(_logger, item.Id);

        try
        {
            var created = await _repository.AddAsync(item);

            Log.CatalogItemCreated(_logger, created.Id);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (Exception exception)
        {
            Log.CatalogItemCreationFailed(_logger, exception);
            throw;
        }
    }

    [HttpDelete("{id?}")]
    public async Task<IActionResult> Delete(string? id)
    {
        var normalizedId = id?.Trim();

        if (string.IsNullOrWhiteSpace(normalizedId))
        {
            Log.MissingCatalogItemIdentifier(_logger);
            return NotFound();
        }

        Log.DeletingCatalogItem(_logger, normalizedId!);

        try
        {
            var deleted = await _repository.DeleteAsync(normalizedId!);

            if (!deleted)
            {
                Log.CatalogItemNotFound(_logger, normalizedId!);
                return NotFound();
            }

            Log.CatalogItemDeleted(_logger, normalizedId!);
            return NoContent();
        }
        catch (Exception exception)
        {
            Log.CatalogItemDeletionFailed(_logger, normalizedId!, exception);
            throw;
        }
    }

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving all catalog items.")]
        public static partial void RequestingCatalogItems(ILogger logger);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Retrieved {Count} catalog items.")]
        public static partial void CatalogItemsRetrieved(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve catalog items.")]
        public static partial void CatalogItemsRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Catalog item identifier is missing or empty.")]
        public static partial void MissingCatalogItemIdentifier(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Retrieving catalog item with identifier '{CatalogItemId}'.")]
        public static partial void RequestingCatalogItem(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Warning, Message = "Catalog item with identifier '{CatalogItemId}' was not found.")]
        public static partial void CatalogItemNotFound(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Information, Message = "Catalog item with identifier '{CatalogItemId}' was retrieved successfully.")]
        public static partial void CatalogItemReturned(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Error, Message = "Failed to retrieve catalog item with identifier '{CatalogItemId}'.")]
        public static partial void CatalogItemRetrievalFailed(ILogger logger, string catalogItemId, Exception exception);

        [LoggerMessage(EventId = 9, Level = LogLevel.Warning, Message = "Catalog item payload is missing.")]
        public static partial void CatalogItemPayloadMissing(ILogger logger);

        [LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "Creating catalog item (incoming identifier: '{CatalogItemId}').")]
        public static partial void CreatingCatalogItem(ILogger logger, string? catalogItemId);

        [LoggerMessage(EventId = 11, Level = LogLevel.Information, Message = "Catalog item with identifier '{CatalogItemId}' was created successfully.")]
        public static partial void CatalogItemCreated(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 12, Level = LogLevel.Error, Message = "Failed to create catalog item.")]
        public static partial void CatalogItemCreationFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 13, Level = LogLevel.Information, Message = "Deleting catalog item with identifier '{CatalogItemId}'.")]
        public static partial void DeletingCatalogItem(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 14, Level = LogLevel.Information, Message = "Catalog item with identifier '{CatalogItemId}' was deleted successfully.")]
        public static partial void CatalogItemDeleted(ILogger logger, string catalogItemId);

        [LoggerMessage(EventId = 15, Level = LogLevel.Error, Message = "Failed to delete catalog item with identifier '{CatalogItemId}'.")]
        public static partial void CatalogItemDeletionFailed(ILogger logger, string catalogItemId, Exception exception);
    }
}
