using System;
using System.Net;
using System.Net.Http.Json;
using feedme.Server.Contracts;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace feedme.Server.Tests;

public class SuppliesApiTests
{
    private const string ChickenId = "8f77b9f3-6a9f-4c09-9cc0-6dbbf53f2a37";

    [Fact]
    public async Task PostSupply_StoresRecordAndReturnsEnrichedPayload()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var arrival = DateTime.UtcNow.Date;
        var expiry = arrival.AddDays(12);

        var request = new
        {
            catalogItemId = ChickenId,
            quantity = 24.5m,
            arrivalDate = arrival,
            expiryDate = expiry,
            warehouse = "Главный склад",
            responsible = "Анна Петрова",
        };

        var response = await client.PostAsJsonAsync("/api/supplies", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<SupplyResponse>();
        Assert.NotNull(created);

        Assert.False(string.IsNullOrWhiteSpace(created!.Id));
        Assert.StartsWith("SUP-", created.DocumentNumber);
        Assert.Equal(request.catalogItemId, created.CatalogItemId);
        Assert.Equal("Курица охлаждённая", created.ProductName);
        Assert.Equal("ООО «Куры Дуры»", created.Supplier);
        Assert.Equal("MEAT-001", created.Sku);
        Assert.Equal("Мясные заготовки", created.Category);
        Assert.Equal("кг", created.Unit);
        Assert.Equal(request.quantity, created.Quantity);
        Assert.Equal(220m, created.UnitPrice);
        Assert.Equal(request.warehouse, created.Warehouse);
        Assert.Equal(request.responsible, created.Responsible);
        Assert.Equal("ok", created.Status);

        var list = await client.GetFromJsonAsync<SupplyResponse[]>("/api/supplies");
        Assert.NotNull(list);
        Assert.Contains(list!, supply => supply.Id == created.Id);
    }

    [Fact]
    public async Task PostSupply_WithExpiryBeforeArrival_ReturnsValidationProblem()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var arrival = DateTime.UtcNow.Date;
        var expiry = arrival.AddDays(-1);

        var request = new
        {
            catalogItemId = ChickenId,
            quantity = 10m,
            arrivalDate = arrival,
            expiryDate = expiry,
        };

        var response = await client.PostAsJsonAsync("/api/supplies", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.True(problem!.Errors.ContainsKey("ExpiryDate"));
    }
}
