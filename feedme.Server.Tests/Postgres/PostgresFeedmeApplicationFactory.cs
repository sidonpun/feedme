using System.Collections.Generic;
using feedme.Server;
using feedme.Server.Configuration;
using feedme.Server.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace feedme.Server.Tests.Postgres;

internal sealed class PostgresFeedmeApplicationFactory(string connectionString)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configurationBuilder) =>
        {
            configurationBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{DatabaseOptions.SectionName}:{nameof(DatabaseOptions.Provider)}"] = DatabaseProvider.Postgres.ToString(),
                [$"ConnectionStrings:{AppDbContext.ConnectionStringName}"] = connectionString
            });
        });
    }
}
