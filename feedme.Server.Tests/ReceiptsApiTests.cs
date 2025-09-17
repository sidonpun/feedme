using System.Net;
using System.Net.Http.Json;
using System.Linq;
using feedme.Server.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

using feedme.Server;

namespace feedme.Server.Tests;

public class ReceiptsApiTests
{
    [Fact]
    public async Task PostReceipt_ReturnsCreatedReceiptWithCalculatedTotals()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var request = new
        {
            number = "RCPT-1001",
            supplier = "Green Foods LLC",
            warehouse = "Central Warehouse",
            receivedAt = DateTime.UtcNow,
            items = new[]
            {
                new { catalogItemId = "CAT-001", itemName = "Tomatoes", quantity = 10.5m, unit = "kg", unitPrice = 2.75m },
                new { catalogItemId = "CAT-002", itemName = "Mozzarella", quantity = 4.0m, unit = "kg", unitPrice = 8.10m }
            }
        };

        var response = await client.PostAsJsonAsync("/api/receipts", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<Receipt>();
        Assert.NotNull(created);
        Assert.False(string.IsNullOrWhiteSpace(created!.Id));
        Assert.Equal(request.number, created.Number);
        Assert.Equal(request.supplier, created.Supplier);
        Assert.Equal(request.items.Length, created.Items.Count);

        var expectedTotal = request.items.Sum(item => item.unitPrice * item.quantity);
        Assert.Equal(expectedTotal, created.TotalAmount);
    }

    [Fact]
    public async Task GetReceiptById_ReturnsStoredReceipt()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/receipts", new
        {
            number = "RCPT-1002",
            supplier = "Fresh Farms",
            warehouse = "North Warehouse",
            receivedAt = DateTime.UtcNow,
            items = new[]
            {
                new { catalogItemId = "CAT-010", itemName = "Basil", quantity = 15.0m, unit = "bunch", unitPrice = 1.20m }
            }
        });

        var created = await createResponse.Content.ReadFromJsonAsync<Receipt>();
        Assert.NotNull(created);

        var response = await client.GetAsync($"/api/receipts/{created!.Id}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var fetched = await response.Content.ReadFromJsonAsync<Receipt>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Id, fetched!.Id);
        Assert.Equal(created.Number, fetched.Number);
        Assert.Equal(created.TotalAmount, fetched.TotalAmount);
    }

    [Fact]
    public async Task GetReceiptById_ReturnsNotFoundForUnknownReceipt()
    {
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/receipts/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
