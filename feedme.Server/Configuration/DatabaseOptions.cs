namespace feedme.Server.Configuration;

public enum DatabaseProvider
{
    InMemory,
    Postgres
}

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";
    public const string DefaultInMemoryDatabaseName = "feedme";

    public string? Provider { get; set; }

    public string? InMemoryName { get; set; }

    public DatabaseProvider ResolveProvider(DatabaseProvider fallbackProvider)
    {
        if (string.IsNullOrWhiteSpace(Provider))
        {
            return fallbackProvider;
        }

        if (Enum.TryParse<DatabaseProvider>(Provider, true, out var provider))
        {
            return provider;
        }

        throw new InvalidOperationException(
            $"Unsupported database provider '{Provider}'. Set '{SectionName}:{nameof(Provider)}' to one of the supported values: {string.Join(", ", Enum.GetNames(typeof(DatabaseProvider)))}.");
    }

    public string ResolveInMemoryDatabaseName()
        => string.IsNullOrWhiteSpace(InMemoryName)
            ? DefaultInMemoryDatabaseName
            : InMemoryName;

}
