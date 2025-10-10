using System;
using System.Collections.Generic;
using System.Linq;
using feedme.Server.Contracts;
using feedme.Server.Models;
using feedme.Server.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class InventoriesController : ControllerBase
{
    private readonly IInventoryRepository _repository;
    private readonly ILogger<InventoriesController> _logger;

    public InventoriesController(IInventoryRepository repository, ILogger<InventoriesController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryResponse>>> Get()
    {
        Log.RequestingInventories(_logger);

        try
        {
            var inventories = (await _repository.GetAllAsync()).ToArray();
            var responses = inventories.Select(MapInventory).ToArray();

            Log.InventoriesReturned(_logger, responses.Length);
            return Ok(responses);
        }
        catch (Exception exception)
        {
            Log.InventoriesRetrievalFailed(_logger, exception);
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InventoryResponse>> GetById(string id)
    {
        var normalizedId = id?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedId))
        {
            Log.InventoryIdentifierMissing(_logger);
            return NotFound();
        }

        Log.RequestingInventory(_logger, normalizedId);

        try
        {
            var document = await _repository.GetByIdAsync(normalizedId);
            if (document is null)
            {
                Log.InventoryNotFound(_logger, normalizedId);
                return NotFound();
            }

            var response = MapInventory(document);
            Log.InventoryReturned(_logger, normalizedId);
            return Ok(response);
        }
        catch (Exception exception)
        {
            Log.InventoryRetrievalFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<InventoryResponse>> Create([FromBody] InventoryDocument document)
    {
        if (document is null)
        {
            Log.InventoryPayloadMissing(_logger);
            return BadRequest();
        }

        Log.CreatingInventory(_logger, document.Id);

        try
        {
            var created = await _repository.AddAsync(document);
            var response = MapInventory(created);

            Log.InventoryCreated(_logger, response.Id);
            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (Exception exception)
        {
            Log.InventoryCreationFailed(_logger, exception);
            throw;
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InventoryResponse>> Update(string id, [FromBody] InventoryDocument document)
    {
        if (document is null)
        {
            Log.InventoryPayloadMissing(_logger);
            return BadRequest();
        }

        if (!string.Equals(id, document.Id, StringComparison.OrdinalIgnoreCase))
        {
            Log.InventoryIdentifierAdjusted(_logger, document.Id, id);
            document.Id = id;
        }

        Log.UpdatingInventory(_logger, id);

        try
        {
            var updated = await _repository.UpdateAsync(document);
            if (updated is null)
            {
                Log.InventoryNotFound(_logger, id);
                return NotFound();
            }

            var response = MapInventory(updated);
            Log.InventoryUpdated(_logger, id);
            return Ok(response);
        }
        catch (Exception exception)
        {
            Log.InventoryUpdateFailed(_logger, id, exception);
            throw;
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            Log.InventoryIdentifierMissing(_logger);
            return NotFound();
        }

        var normalizedId = id.Trim();

        Log.DeletingInventory(_logger, normalizedId);

        try
        {
            var removed = await _repository.RemoveAsync(normalizedId);
            if (!removed)
            {
                Log.InventoryNotFound(_logger, normalizedId);
                return NotFound();
            }

            Log.InventoryDeleted(_logger, normalizedId);
            return NoContent();
        }
        catch (Exception exception)
        {
            Log.InventoryDeletionFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    private static InventoryResponse MapInventory(InventoryDocument document)
    {
        var items = (document.Items ?? Enumerable.Empty<InventoryLine>())
            .Select(MapInventoryLine)
            .ToArray();

        return new InventoryResponse(
            document.Id,
            document.Number,
            document.Warehouse,
            document.Responsible,
            document.StartedAt,
            document.CompletedAt,
            document.Status,
            items.Sum(item => item.ExpectedCost),
            items.Sum(item => item.CountedCost),
            items.Sum(item => item.DifferenceCost),
            items.Length,
            items);
    }

    private static InventoryLineResponse MapInventoryLine(InventoryLine line)
    {
        return new InventoryLineResponse(
            line.CatalogItemId,
            line.Sku,
            line.ItemName,
            line.Category,
            line.ExpectedQuantity,
            line.CountedQuantity,
            line.DifferenceQuantity,
            line.Unit,
            line.UnitPrice,
            line.ExpectedCost,
            line.CountedCost,
            line.DifferenceCost);
    }

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving inventory documents.")]
        public static partial void RequestingInventories(ILogger logger);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Returned {Count} inventory documents.")]
        public static partial void InventoriesReturned(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve inventory documents.")]
        public static partial void InventoriesRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Inventory identifier is missing or empty.")]
        public static partial void InventoryIdentifierMissing(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Retrieving inventory document '{InventoryId}'.")]
        public static partial void RequestingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was retrieved successfully.")]
        public static partial void InventoryReturned(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Warning, Message = "Inventory document '{InventoryId}' was not found.")]
        public static partial void InventoryNotFound(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Error, Message = "Failed to retrieve inventory document '{InventoryId}'.")]
        public static partial void InventoryRetrievalFailed(ILogger logger, string inventoryId, Exception exception);

        [LoggerMessage(EventId = 9, Level = LogLevel.Warning, Message = "Inventory payload is missing.")]
        public static partial void InventoryPayloadMissing(ILogger logger);

        [LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "Creating inventory document '{InventoryId}'.")]
        public static partial void CreatingInventory(ILogger logger, string? inventoryId);

        [LoggerMessage(EventId = 11, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was created successfully.")]
        public static partial void InventoryCreated(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 12, Level = LogLevel.Error, Message = "Failed to create inventory document.")]
        public static partial void InventoryCreationFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 13, Level = LogLevel.Information, Message = "Adjusting inventory identifier from '{OriginalInventoryId}' to '{NormalizedInventoryId}'.")]
        public static partial void InventoryIdentifierAdjusted(ILogger logger, string? originalInventoryId, string normalizedInventoryId);

        [LoggerMessage(EventId = 14, Level = LogLevel.Information, Message = "Updating inventory document '{InventoryId}'.")]
        public static partial void UpdatingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 15, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was updated successfully.")]
        public static partial void InventoryUpdated(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 16, Level = LogLevel.Error, Message = "Failed to update inventory document '{InventoryId}'.")]
        public static partial void InventoryUpdateFailed(ILogger logger, string inventoryId, Exception exception);

        [LoggerMessage(EventId = 17, Level = LogLevel.Information, Message = "Deleting inventory document '{InventoryId}'.")]
        public static partial void DeletingInventory(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 18, Level = LogLevel.Information, Message = "Inventory document '{InventoryId}' was deleted successfully.")]
        public static partial void InventoryDeleted(ILogger logger, string inventoryId);

        [LoggerMessage(EventId = 19, Level = LogLevel.Error, Message = "Failed to delete inventory document '{InventoryId}'.")]
        public static partial void InventoryDeletionFailed(ILogger logger, string inventoryId, Exception exception);
    }
}
