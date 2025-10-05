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
    public void Create_AppliesAdditionalEnvironmentOverrides()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            [$"ConnectionStrings:{ConnectionStringName}"] = "Host=localhost;Port=5432;Database=feedme_dev;Username=postgres;Password=postgres",
            ["DATABASE_HOST"] = "database.example.com",
            ["DB_PORT"] = "6543",
            ["DATABASE_NAME"] = "warehouse",
            ["DB_USER"] = "warehouse-user",
            ["DATABASE_PASSWORD"] = "warehouse-password",
            ["DATABASE_SSLMODE"] = "Disable"
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("database.example.com", builder.Host);
        Assert.Equal(6543, builder.Port);
        Assert.Equal("warehouse", builder.Database);
        Assert.Equal("warehouse-user", builder.Username);
        Assert.Equal("warehouse-password", builder.Password);
        Assert.Equal(SslMode.Disable, builder.SslMode);
    }

    [Fact]
    public void Create_UsesDatabaseConnectionStringOverride()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Database:ConnectionString"] = "Host=185.251.90.40;Port=5432;Database=feedme;Username=feedme;Password=feedme"
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("185.251.90.40", builder.Host);
        Assert.Equal(5432, builder.Port);
        Assert.Equal("feedme", builder.Database);
        Assert.Equal("feedme", builder.Username);
        Assert.Equal("feedme", builder.Password);
    }

    [Fact]
    public void Create_UsesDatabaseUrlOverride()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Database:Url"] = "postgres://feedme-user:secret@185.251.90.40:5434/feedme"
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("185.251.90.40", builder.Host);
        Assert.Equal(5434, builder.Port);
        Assert.Equal("feedme", builder.Database);
        Assert.Equal("feedme-user", builder.Username);
        Assert.Equal("secret", builder.Password);
    }

    [Fact]
    public void Create_UsesDatabaseUrlOverride_WithQueryParameters()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Database:Url"] = "postgresql://feedme:password@185.251.90.40/feedme?SslMode=Require&Pooling=true"
        });

        var connectionString = PostgresConnectionStringFactory.Create(configuration, ConnectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("185.251.90.40", builder.Host);
        Assert.Equal(5432, builder.Port);
        Assert.Equal("feedme", builder.Database);
        Assert.Equal("feedme", builder.Username);
        Assert.Equal("password", builder.Password);
        Assert.Equal(SslMode.Require, builder.SslMode);
        Assert.True(builder.Pooling);
    }

    [Fact]
    public void Create_ThrowsInvalidOperationException_ForUnsupportedUrlScheme()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Database:Url"] = "mysql://feedme:password@localhost/feedme"
        });

        Assert.Throws<InvalidOperationException>(() => PostgresConnectionStringFactory.Create(configuration, ConnectionStringName));
    }

    [Fact]
    public void Create_ThrowsInvalidOperationException_ForInvalidUrl()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Database:Url"] = "not-a-valid-url"
        });

        Assert.Throws<InvalidOperationException>(() => PostgresConnectionStringFactory.Create(configuration, ConnectionStringName));
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
