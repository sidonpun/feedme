using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace feedme.Server.Configuration;

internal static class DatabaseProviderResolver
{
    private static readonly string[] PostgresProviderAliases = ["Postgres", "PostgreSql", "Npgsql"];

    public static DatabaseProvider Resolve(IConfiguration configuration, IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var providerValue = configuration["Database:Provider"];

        if (!string.IsNullOrWhiteSpace(providerValue))
        {
            return ParseProvider(providerValue);
        }

        if (environment.IsDevelopment())
        {
            return DatabaseProvider.InMemory;
        }

        throw new InvalidOperationException(
            "Database provider is not configured. Set the 'Database:Provider' configuration value to 'Postgres' or 'InMemory'.");
    }

    public static DatabaseProvider ParseProvider(string providerValue)
    {
        if (string.IsNullOrWhiteSpace(providerValue))
        {
            throw new InvalidOperationException("Database provider name cannot be null or whitespace.");
        }

        if (string.Equals(providerValue, "InMemory", StringComparison.OrdinalIgnoreCase))
        {
            return DatabaseProvider.InMemory;
        }

        if (PostgresProviderAliases.Any(alias => string.Equals(providerValue, alias, StringComparison.OrdinalIgnoreCase)))
        {
            return DatabaseProvider.Postgres;
        }

        throw new InvalidOperationException(
            $"Unsupported database provider '{providerValue}'. Supported providers: 'Postgres' and 'InMemory'.");
    }
}
