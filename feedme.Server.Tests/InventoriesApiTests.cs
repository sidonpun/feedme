using System;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using feedme.Server.Contracts;
using Xunit;

namespace feedme.Server.Tests;

public class InventoriesApiTests
{
    [Fact]
    public async Task PostInventory_ReturnsCalculatedTotals()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var request = new
        {
            number = "INV-5001",
            warehouse = "Главный склад",
            responsible = "Иван Петров",
            startedAt = DateTime.UtcNow.AddDays(-2),
            status = "in-progress",
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-100",
                    sku = "CAT-100",
                    itemName = "Свежие яблоки",
                    category = "Фрукты",
                    expectedQuantity = 25.0m,
                    countedQuantity = 22.5m,
                    unit = "кг",
                    unitPrice = 180.50m
                },
                new
                {
                    catalogItemId = "CAT-200",
                    sku = "CAT-200",
                    itemName = "Сыр Буратта",
                    category = "Сыры",
                    expectedQuantity = 12.0m,
                    countedQuantity = 12.0m,
                    unit = "кг",
                    unitPrice = 920.0m
                }
            }
        };

        var response = await client.PostAsJsonAsync("/api/inventories", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(created);
        Assert.Equal(request.number, created!.Number);
        Assert.Equal(request.warehouse, created.Warehouse);
        Assert.Equal(request.items.Length, created.Items.Count);

        var expectedTotal = request.items.Sum(item => item.expectedQuantity * item.unitPrice);
        var countedTotal = request.items.Sum(item => item.countedQuantity * item.unitPrice);
        Assert.Equal(expectedTotal, created.TotalExpected);
        Assert.Equal(countedTotal, created.TotalCounted);
        Assert.Equal(countedTotal - expectedTotal, created.TotalDifference);

        Assert.All(created.Items, line =>
        {
            var source = request.items.Single(item => item.catalogItemId == line.CatalogItemId);
            var differenceQuantity = source.countedQuantity - source.expectedQuantity;
            Assert.Equal(differenceQuantity, line.DifferenceQuantity);
        });
    }

    [Fact]
    public async Task PutInventory_UpdatesExistingDocument()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/inventories", new
        {
            number = "INV-5002",
            warehouse = "Бар",
            responsible = "Мария Смирнова",
            startedAt = DateTime.UtcNow.AddDays(-1),
            status = "draft",
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-300",
                    sku = "CAT-300",
                    itemName = "Лайм",
                    category = "Фрукты",
                    expectedQuantity = 40.0m,
                    countedQuantity = 40.0m,
                    unit = "шт",
                    unitPrice = 35.0m
                }
            }
        });

        var created = await createResponse.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(created);

        var updatePayload = new
        {
            id = created!.Id,
            number = "INV-5002",
            warehouse = "Бар",
            responsible = "Мария Смирнова",
            startedAt = created.StartedAt,
            completedAt = DateTime.UtcNow,
            status = "completed",
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-300",
                    sku = "CAT-300",
                    itemName = "Лайм",
                    category = "Фрукты",
                    expectedQuantity = 40.0m,
                    countedQuantity = 35.0m,
                    unit = "шт",
                    unitPrice = 35.0m
                },
                new
                {
                    catalogItemId = "CAT-301",
                    sku = "CAT-301",
                    itemName = "Лимон",
                    category = "Фрукты",
                    expectedQuantity = 25.0m,
                    countedQuantity = 30.0m,
                    unit = "шт",
                    unitPrice = 28.0m
                }
            }
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/inventories/{created.Id}", updatePayload);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var updated = await updateResponse.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(updated);
        Assert.Equal("completed", updated!.Status);
        Assert.Equal(updatePayload.items.Length, updated.Items.Count);
        Assert.NotNull(updated.CompletedAt);
        Assert.True(updated.TotalDifference != 0);
    }

    [Fact]
    public async Task DeleteInventory_RemovesDocument()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/inventories", new
        {
            number = "INV-5003",
            warehouse = "Склад заготовок",
            responsible = "Алексей Иванов",
            startedAt = DateTime.UtcNow.AddHours(-6),
            status = "draft",
            items = new[]
            {
                new
                {
                    catalogItemId = "CAT-400",
                    sku = "CAT-400",
                    itemName = "Соус Терияки",
                    category = "Соусы",
                    expectedQuantity = 15.0m,
                    countedQuantity = 15.5m,
                    unit = "л",
                    unitPrice = 410.0m
                }
            }
        });

        var created = await createResponse.Content.ReadFromJsonAsync<InventoryResponse>();
        Assert.NotNull(created);

        var deleteResponse = await client.DeleteAsync($"/api/inventories/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/inventories/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }
}
