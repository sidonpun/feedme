using feedme.Server.Configuration;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Xunit;

namespace feedme.Server.Tests.Configuration;

public class PostgresConnectionStringFactoryTests
{
    private const string ConnectionStringName = "WarehouseDb";

    [Fact]
    public void Create_ReturnsPrimaryConnectionString_WhenNoOverridesProvided()
    {
        var expectedConnectionString = "Host=localhost;Port=5432;Database=feedme_dev;Username=postgres;Password=postgres";
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [$"ConnectionStrings:{ConnectionStringName}"] = expectedConnectionString
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);

        Assert.Equal(expectedConnectionString, connectionString);
    }

    [Fact]
    public void Create_ReturnsFallbackConnectionString_WhenPrimaryIsMissing()
    {
        var expectedConnectionString = "Host=localhost;Port=5432;Database=feedme;Username=postgres;Password=postgres";
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = expectedConnectionString
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);

        Assert.Equal(expectedConnectionString, connectionString);
    }

    [Fact]
    public void Create_AppliesDatabaseSectionOverrides()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [$"ConnectionStrings:{ConnectionStringName}"] = "Host=localhost;Port=5432;Database=feedme_dev;Username=postgres;Password=postgres",
            ["Database:Host"] = "db.internal",
            ["Database:Port"] = "15432",
            ["Database:Name"] = "custom",
            ["Database:Username"] = "feedme",
            ["Database:Password"] = "secret",
            ["Database:SslMode"] = "Require"
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("db.internal", builder.Host);
        Assert.Equal(15432, builder.Port);
        Assert.Equal("custom", builder.Database);
        Assert.Equal("feedme", builder.Username);
        Assert.Equal("secret", builder.Password);
        Assert.Equal(SslMode.Require, builder.SslMode);
    }

    [Fact]
    public void Create_AppliesPostgresEnvironmentOverrides()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [$"ConnectionStrings:{ConnectionStringName}"] = "Host=localhost;Port=5432;Database=feedme_dev;Username=postgres;Password=postgres",
            ["POSTGRES_HOST"] = "env-host",
            ["POSTGRES_PORT"] = "6432",
            ["POSTGRES_DB"] = "env-db",
            ["POSTGRES_USER"] = "env-user",
            ["POSTGRES_PASSWORD"] = "env-password"
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("env-host", builder.Host);
        Assert.Equal(6432, builder.Port);
        Assert.Equal("env-db", builder.Database);
        Assert.Equal("env-user", builder.Username);
        Assert.Equal("env-password", builder.Password);
    }

    [Fact]
    public void Create_ThrowsInvalidOperationException_ForInvalidPort()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [$"ConnectionStrings:{ConnectionStringName}"] = "Host=localhost;Port=5432;Database=feedme_dev;Username=postgres;Password=postgres",
            ["Database:Port"] = "invalid"
        });

        Assert.Throws<InvalidOperationException>(() => PostgresConnectionStringFactory.Create(configuration, ConnectionStringName));
    }

    [Fact]
    public void Create_ThrowsInvalidOperationException_WhenConnectionStringMissing()
    {
        var configuration = BuildConfiguration(Array.Empty<KeyValuePair<string, string?>>());

        Assert.Throws<InvalidOperationException>(() => PostgresConnectionStringFactory.Create(configuration, ConnectionStringName));
    }

    private static IConfiguration BuildConfiguration(IEnumerable<KeyValuePair<string, string?>> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }
}
