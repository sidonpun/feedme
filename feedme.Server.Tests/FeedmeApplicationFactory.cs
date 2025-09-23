using feedme.Server;
using feedme.Server.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace feedme.Server.Tests;

internal sealed class FeedmeApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configurationBuilder) =>
        {
            configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{DatabaseOptions.SectionName}:{nameof(DatabaseOptions.Provider)}"] = DatabaseProvider.InMemory.ToString(),
                [$"{DatabaseOptions.SectionName}:{nameof(DatabaseOptions.InMemoryName)}"] = $"feedme-tests-{Guid.NewGuid():N}"
            });
        });
    }
}
