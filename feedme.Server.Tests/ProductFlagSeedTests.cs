using System;
using System.Linq;
using System.Threading.Tasks;
using feedme.Server.Data;
using feedme.Server.Data.Seed;
using feedme.Server.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace feedme.Server.Tests;

public class ProductFlagSeedTests
{
    [Fact]
    public async Task SeedAsync_PopulatesDefaultProductFlags()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"flags-tests-{Guid.NewGuid():N}")
            .Options;

        await using var context = new AppDbContext(options);

        await AppDbContextSeeder.SeedAsync(context);

        var codes = await context.ProductFlags
            .AsNoTracking()
            .Where(flag => flag.IsActive)
            .Select(flag => flag.Code)
            .OrderBy(code => code)
            .ToArrayAsync();

        Assert.Equal(
            new[]
            {
                ProductFlagCodes.Fragile,
                ProductFlagCodes.Pack,
                ProductFlagCodes.SpoilOpen,
                ProductFlagCodes.Temp,
            },
            codes);
    }
}

