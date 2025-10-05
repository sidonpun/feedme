using System;
using System.Net;
using System.Net.Http.Json;
using System.Linq;
using feedme.Server.Contracts;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace feedme.Server.Tests;

public class ReceiptsApiTests
{
    [Fact]
    public async Task PostReceipt_ReturnsCreatedReceiptWithCalculatedTotals()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var receivedAt = DateTime.UtcNow.AddDays(-10);
        var request = new
        {
            number = "RCPT-1001",
            supplier = "Green Foods LLC",
            warehouse = "Central Warehouse",
            receivedAt,
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-001",
                    sku = "CAT-001",
                    itemName = "Tomatoes",
                    category = "Produce",
                    quantity = 10.5m,
                    unit = "kg",
                    unitPrice = 2.75m,
                    expiryDate = DateTime.UtcNow.AddDays(2),
                    status = "warning"
                },
                new
                {
                    catalogItemId = "CAT-002",
                    sku = "CAT-002",
                    itemName = "Mozzarella",
                    category = "Dairy",
                    quantity = 4.0m,
                    unit = "kg",
                    unitPrice = 8.10m,
                    expiryDate = DateTime.UtcNow.AddDays(20),
                    status = "ok"
                }
            }
        };

        var response = await client.PostAsJsonAsync("/api/receipts", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<ReceiptResponse>();
        Assert.NotNull(created);
        Assert.False(string.IsNullOrWhiteSpace(created!.Id));
        Assert.Equal(request.number, created.Number);
        Assert.Equal(request.supplier, created.Supplier);
        Assert.Equal(request.items.Length, created.Items.Count);

        var expectedTotal = request.items.Sum(item => item.unitPrice * item.quantity);
        Assert.Equal(expectedTotal, created.TotalAmount);

        var statuses = created.Items.Select(item => item.Status).ToArray();
        Assert.Contains("warning", statuses);
        Assert.Contains("ok", statuses);
    }

    [Fact]
    public async Task GetReceiptById_ReturnsStoredReceipt()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/receipts", new
        {
            number = "RCPT-1002",
            supplier = "Fresh Farms",
            warehouse = "North Warehouse",
            receivedAt = DateTime.UtcNow.AddDays(-5),
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-010",
                    sku = "CAT-010",
                    itemName = "Basil",
                    category = "Herbs",
                    quantity = 15.0m,
                    unit = "bunch",
                    unitPrice = 1.20m,
                    expiryDate = DateTime.UtcNow.AddDays(-1),
                    status = "expired"
                }
            }
        });

        var created = await createResponse.Content.ReadFromJsonAsync<ReceiptResponse>();
        Assert.NotNull(created);

        var response = await client.GetAsync($"/api/receipts/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var fetched = await response.Content.ReadFromJsonAsync<ReceiptResponse>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched!.Id);
        Assert.Equal(created.Number, fetched.Number);
        Assert.Equal(created.TotalAmount, fetched.TotalAmount);
        Assert.All(fetched.Items, item => Assert.Equal("expired", item.Status));
    }

    [Fact]
    public async Task GetReceiptById_ReturnsNotFoundForUnknownReceipt()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/receipts/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetReceipts_ReturnsLinesForStoredReceipts()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/receipts", new
        {
            number = "RCPT-2001",
            supplier = "Supply Co",
            warehouse = "South Warehouse",
            receivedAt = DateTime.UtcNow.AddDays(-2),
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-500",
                    sku = "CAT-500",
                    itemName = "Roasted Chicken",
                    category = "Prepared",
                    quantity = 3.0m,
                    unit = "pcs",
                    unitPrice = 250.0m,
                    expiryDate = DateTime.UtcNow.AddDays(5),
                    status = "warning"
                }
            }
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var listResponse = await client.GetFromJsonAsync<ReceiptResponse[]>("/api/receipts");
        Assert.NotNull(listResponse);

        Assert.Contains(
            listResponse!,
            receipt => receipt.Items.Any(item => item.CatalogItemId == "CAT-500")
        );
    }

    [Fact]
    public async Task PostReceipt_ReturnsBadRequest_WhenItemsContainNullEntries()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/receipts", new
        {
            number = "RCPT-4001",
            supplier = "Null Supplier",
            warehouse = "Warehouse 7",
            responsible = "Manager",
            receivedAt = DateTime.UtcNow,
            items = new object?[] { null }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.True(problem!.Errors.TryGetValue("Items", out var errors));
        Assert.Contains(errors, message => message.Contains("null", StringComparison.OrdinalIgnoreCase));
    }
}
