using System;
using System.Collections.Generic;
using System.Linq;
using feedme.Server.Contracts;
using feedme.Server.Models;
using feedme.Server.Repositories;
using feedme.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public partial class ReceiptsController : ControllerBase
{
    private readonly IReceiptRepository _repository;
    private readonly ILogger<ReceiptsController> _logger;

    public ReceiptsController(IReceiptRepository repository, ILogger<ReceiptsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReceiptResponse>>> Get()
    {
        Log.RequestingReceipts(_logger);

        try
        {
            var receipts = (await _repository.GetAllAsync()).ToArray();
            var responses = receipts.Select(MapReceipt).ToArray();

            Log.ReceiptsRetrieved(_logger, responses.Length);

            return Ok(responses);
        }
        catch (Exception exception)
        {
            Log.ReceiptsRetrievalFailed(_logger, exception);
            throw;
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReceiptResponse>> GetById(string id)
    {
        var normalizedId = id?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedId))
        {
            Log.MissingReceiptIdentifier(_logger);
            return NotFound();
        }

        Log.RequestingReceipt(_logger, normalizedId);

        try
        {
            var receipt = await _repository.GetByIdAsync(normalizedId);

            if (receipt is null)
            {
                Log.ReceiptNotFound(_logger, normalizedId);
                return NotFound();
            }

            Log.ReceiptReturned(_logger, normalizedId);
            return Ok(MapReceipt(receipt));
        }
        catch (Exception exception)
        {
            Log.ReceiptRetrievalFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    [HttpPost]
    public async Task<ActionResult<ReceiptResponse>> Create([FromBody] Receipt receipt)
    {
        if (receipt is null)
        {
            Log.ReceiptPayloadMissing(_logger);
            return BadRequest();
        }

        Log.CreatingReceipt(_logger, receipt.Id);

        if (!ValidateReceiptPayload(receipt))
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var created = await _repository.AddAsync(receipt);
            var response = MapReceipt(created);

            Log.ReceiptCreated(_logger, response.Id);

            return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
        }
        catch (Exception exception)
        {
            Log.ReceiptCreationFailed(_logger, exception);
            throw;
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReceiptResponse>> Update(string id, [FromBody] Receipt receipt)
    {
        if (receipt is null)
        {
            Log.ReceiptPayloadMissing(_logger);
            return BadRequest();
        }

        if (!string.Equals(id, receipt.Id, StringComparison.OrdinalIgnoreCase))
        {
            Log.ReceiptIdentifierAdjusted(_logger, receipt.Id, id);
            receipt.Id = id;
        }

        if (!ValidateReceiptPayload(receipt))
        {
            return ValidationProblem(ModelState);
        }

        Log.UpdatingReceipt(_logger, id);

        try
        {
            var updated = await _repository.UpdateAsync(receipt);

            if (updated is null)
            {
                Log.ReceiptNotFound(_logger, id);
                return NotFound();
            }

            Log.ReceiptUpdated(_logger, id);
            return Ok(MapReceipt(updated));
        }
        catch (Exception exception)
        {
            Log.ReceiptUpdateFailed(_logger, id, exception);
            throw;
        }
    }

    private bool ValidateReceiptPayload(Receipt receipt)
    {
        if (receipt.Items is null || receipt.Items.Count == 0)
        {
            ModelState.AddModelError(nameof(Receipt.Items), "A receipt must contain at least one item.");
            return false;
        }

        if (receipt.Items.Any(item => item is null))
        {
            ModelState.AddModelError(nameof(Receipt.Items), "Receipt items cannot contain null values.");
            return false;
        }

        return true;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var normalizedId = id?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedId))
        {
            Log.MissingReceiptIdentifier(_logger);
            return NotFound();
        }

        Log.DeletingReceipt(_logger, normalizedId);

        try
        {
            var removed = await _repository.RemoveAsync(normalizedId);

            if (!removed)
            {
                Log.ReceiptNotFound(_logger, normalizedId);
                return NotFound();
            }

            Log.ReceiptDeleted(_logger, normalizedId);
            return NoContent();
        }
        catch (Exception exception)
        {
            Log.ReceiptDeletionFailed(_logger, normalizedId, exception);
            throw;
        }
    }

    private static ReceiptResponse MapReceipt(Receipt receipt)
    {
        var lines = (receipt.Items ?? Enumerable.Empty<ReceiptLine>())
            .Select(line => MapLine(line, receipt.ReceivedAt))
            .ToArray();

        return new ReceiptResponse(
            receipt.Id,
            receipt.Number,
            receipt.Supplier,
            receipt.Warehouse,
            receipt.Responsible,
            receipt.ReceivedAt,
            lines,
            receipt.TotalAmount);
    }

    private static ReceiptLineResponse MapLine(ReceiptLine line, DateTime receivedAt)
    {
        var status = string.IsNullOrWhiteSpace(line.Status)
            ? (line.ExpiryDate.HasValue
                ? ShelfLifeStatusCalculator.Evaluate(receivedAt, line.ExpiryDate.Value).ToCode()
                : ShelfLifeState.Ok.ToCode())
            : line.Status;

        return new ReceiptLineResponse(
            line.CatalogItemId,
            line.Sku,
            line.ItemName,
            line.Category,
            line.Quantity,
            line.Unit,
            line.UnitPrice,
            line.TotalCost,
            line.ExpiryDate,
            status);
    }

    private static partial class Log
    {
        [LoggerMessage(EventId = 1, Level = LogLevel.Information, Message = "Retrieving all receipts.")]
        public static partial void RequestingReceipts(ILogger logger);

        [LoggerMessage(EventId = 2, Level = LogLevel.Information, Message = "Retrieved {Count} receipts.")]
        public static partial void ReceiptsRetrieved(ILogger logger, int count);

        [LoggerMessage(EventId = 3, Level = LogLevel.Error, Message = "Failed to retrieve receipts.")]
        public static partial void ReceiptsRetrievalFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 4, Level = LogLevel.Warning, Message = "Receipt identifier is missing or empty.")]
        public static partial void MissingReceiptIdentifier(ILogger logger);

        [LoggerMessage(EventId = 5, Level = LogLevel.Information, Message = "Retrieving receipt with identifier '{ReceiptId}'.")]
        public static partial void RequestingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 6, Level = LogLevel.Warning, Message = "Receipt with identifier '{ReceiptId}' was not found.")]
        public static partial void ReceiptNotFound(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 7, Level = LogLevel.Information, Message = "Receipt with identifier '{ReceiptId}' was retrieved successfully.")]
        public static partial void ReceiptReturned(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 8, Level = LogLevel.Error, Message = "Failed to retrieve receipt with identifier '{ReceiptId}'.")]
        public static partial void ReceiptRetrievalFailed(ILogger logger, string receiptId, Exception exception);

        [LoggerMessage(EventId = 9, Level = LogLevel.Warning, Message = "Receipt payload is missing.")]
        public static partial void ReceiptPayloadMissing(ILogger logger);

        [LoggerMessage(EventId = 10, Level = LogLevel.Information, Message = "Creating receipt (incoming identifier: '{ReceiptId}').")]
        public static partial void CreatingReceipt(ILogger logger, string? receiptId);

        [LoggerMessage(EventId = 11, Level = LogLevel.Information, Message = "Receipt with identifier '{ReceiptId}' was created successfully.")]
        public static partial void ReceiptCreated(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 12, Level = LogLevel.Error, Message = "Failed to create receipt.")]
        public static partial void ReceiptCreationFailed(ILogger logger, Exception exception);

        [LoggerMessage(EventId = 13, Level = LogLevel.Information, Message = "Updating receipt with identifier '{ReceiptId}'.")]
        public static partial void UpdatingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 14, Level = LogLevel.Information, Message = "Receipt identifier adjusted from '{OriginalReceiptId}' to '{NormalizedReceiptId}'.")]
        public static partial void ReceiptIdentifierAdjusted(ILogger logger, string? originalReceiptId, string normalizedReceiptId);

        [LoggerMessage(EventId = 15, Level = LogLevel.Information, Message = "Receipt with identifier '{ReceiptId}' was updated successfully.")]
        public static partial void ReceiptUpdated(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 16, Level = LogLevel.Error, Message = "Failed to update receipt with identifier '{ReceiptId}'.")]
        public static partial void ReceiptUpdateFailed(ILogger logger, string receiptId, Exception exception);

        [LoggerMessage(EventId = 17, Level = LogLevel.Information, Message = "Deleting receipt with identifier '{ReceiptId}'.")]
        public static partial void DeletingReceipt(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 18, Level = LogLevel.Information, Message = "Receipt with identifier '{ReceiptId}' was deleted successfully.")]
        public static partial void ReceiptDeleted(ILogger logger, string receiptId);

        [LoggerMessage(EventId = 19, Level = LogLevel.Error, Message = "Failed to delete receipt with identifier '{ReceiptId}'.")]
        public static partial void ReceiptDeletionFailed(ILogger logger, string receiptId, Exception exception);
    }
}
