using feedme.Server.Data;
using feedme.Server.Data.Seed;
using feedme.Server.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace feedme.Server.Extensions;

public static class WebApplicationExtensions
{
    public static Task ApplyMigrationsAsync(this WebApplication app, CancellationToken cancellationToken = default)
    {
        return DatabaseMigrationRetryPolicy.ExecuteAsync(
            async token =>
            {
                await using var scope = app.Services.CreateAsyncScope();
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                if (context.Database.IsRelational())
                {
                    await context.Database.MigrateAsync(token).ConfigureAwait(false);
                }
                else
                {
                    await context.Database.EnsureCreatedAsync(token).ConfigureAwait(false);
                }
            },
            app.Logger,
            cancellationToken);
    }

    public static async Task SeedDatabaseAsync(this WebApplication app, CancellationToken cancellationToken = default)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await AppDbContextSeeder.SeedAsync(context, cancellationToken).ConfigureAwait(false);
    }
}
