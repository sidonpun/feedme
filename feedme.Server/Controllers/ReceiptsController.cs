using System;
using System.Collections.Generic;
using System.Linq;
using feedme.Server.Contracts;
using feedme.Server.Models;
using feedme.Server.Repositories;
using feedme.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace feedme.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly IReceiptRepository _repository;

    public ReceiptsController(IReceiptRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReceiptResponse>>> Get()
    {
        var receipts = await _repository.GetAllAsync();
        return Ok(receipts.Select(MapReceipt));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReceiptResponse>> GetById(string id)
    {
        var receipt = await _repository.GetByIdAsync(id);
        return receipt is null ? NotFound() : Ok(MapReceipt(receipt));
    }

    [HttpPost]
    public async Task<ActionResult<ReceiptResponse>> Create([FromBody] Receipt receipt)
    {
        var created = await _repository.AddAsync(receipt);
        var response = MapReceipt(created);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReceiptResponse>> Update(string id, [FromBody] Receipt receipt)
    {
        if (receipt is null)
        {
            return BadRequest();
        }

        if (!string.Equals(id, receipt.Id, StringComparison.OrdinalIgnoreCase))
        {
            receipt.Id = id;
        }

        var updated = await _repository.UpdateAsync(receipt);
        return updated is null ? NotFound() : Ok(MapReceipt(updated));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var removed = await _repository.RemoveAsync(id);
        return removed ? NoContent() : NotFound();
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
}
