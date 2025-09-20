using System.Net;
using System.Net.Http.Json;
using feedme.Server.Models;
using Xunit;

namespace feedme.Server.Tests;

public class CatalogApiTests
{
    [Fact]
    public async Task DeleteCatalogItem_RemovesItemAndReturnsNoContent()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var createRequest = new
        {
            name = "Fresh Basil",
            type = "Ingredient",
            code = "BAS-001",
            category = "Herbs",
            unit = "bunch",
            weight = 0.15,
            writeoffMethod = "FIFO",
            allergens = string.Empty,
            packagingRequired = false,
            spoilsAfterOpening = true,
            supplier = "Green Valley",
            deliveryTime = 2,
            costEstimate = 1.10,
            taxRate = "10%",
            unitPrice = 1.50,
            salePrice = 2.20,
            tnved = "0902",
            isMarked = false,
            isAlcohol = false,
            alcoholCode = string.Empty,
            alcoholStrength = 0.0,
            alcoholVolume = 0.0
        };

        var createResponse = await client.PostAsJsonAsync("/api/catalog", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdItem = await createResponse.Content.ReadFromJsonAsync<CatalogItem>();
        Assert.NotNull(createdItem);

        var deleteResponse = await client.DeleteAsync($"/api/catalog/{createdItem!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/catalog/{createdItem.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task DeleteCatalogItem_ReturnsNotFoundForUnknownIdentifier()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.DeleteAsync($"/api/catalog/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCatalogItem_ReturnsNotFoundForInvalidIdentifier()
    {
        await using var factory = new FeedmeApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.DeleteAsync("/api/catalog/   ");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
