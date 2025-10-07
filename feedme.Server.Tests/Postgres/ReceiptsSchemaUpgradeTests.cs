using System;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using feedme.Server.Contracts;
using feedme.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace feedme.Server.Tests.Postgres;

public class ReceiptsSchemaUpgradeTests
{
    [Fact]
    public async Task PostReceipt_SucceedsWhenExpiryDateColumnIsMissing()
    {
        if (!await PostgresDatabaseHelper.TryEnsureServerAsync())
        {
            return;
        }

        var databaseName = await PostgresDatabaseHelper.CreateDatabaseAsync();
        var connectionString = $"Host=localhost;Port=5432;Database={databaseName};Username=feedme;Password=feedme";

        try
        {
            await using var factory = new PostgresFeedmeApplicationFactory(connectionString);
            await using (var scope = factory.Services.CreateAsyncScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await dbContext.Database.MigrateAsync();
            }

            using var client = factory.CreateClient();

            await client.GetAsync("/health");
            await PostgresDatabaseHelper.RemoveExpiryDateColumnAsync(connectionString);

            var response = await client.PostAsJsonAsync("/api/receipts", new
            {
                number = "AUTO-5001",
                supplier = "Автономный поставщик",
                warehouse = "Тестовый склад",
                responsible = "Не назначен",
                receivedAt = DateTime.UtcNow,
                items = new[]
                {
                    new
                    {
                        catalogItemId = "test-001",
                        sku = "test-001",
                        itemName = "Тестовый товар",
                        category = "Тест",
                        quantity = 1.0m,
                        unit = "шт",
                        unitPrice = 100.0m,
                        expiryDate = DateTime.UtcNow.AddDays(5),
                        status = "ok"
                    }
                }
            });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);

            var created = await response.Content.ReadFromJsonAsync<ReceiptResponse>();
            Assert.NotNull(created);
            Assert.Equal("Тестовый товар", created!.Items[0].ItemName);
            Assert.Equal("ok", created.Items[0].Status);
        }
        finally
        {
            await PostgresDatabaseHelper.DropDatabaseAsync(databaseName);
        }
    }
}
