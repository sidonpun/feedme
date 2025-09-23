using feedme.Server.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Xunit;

namespace feedme.Server.Tests.Configuration;

public class DatabaseProviderResolverTests
{
    [Fact]
    public void Resolve_ReturnsConfiguredPostgresProvider()
    {
        var configuration = BuildConfiguration([new KeyValuePair<string, string?>("Database:Provider", "Postgres")]);
        var environment = new TestHostEnvironment { EnvironmentName = Environments.Production };

        var provider = DatabaseProviderResolver.Resolve(configuration, environment);

        Assert.Equal(DatabaseProvider.Postgres, provider);
    }

    [Theory]
    [InlineData("InMemory")]
    [InlineData("inmemory")]
    public void Resolve_ReturnsInMemoryProvider_WhenExplicitlyConfigured(string value)
    {
        var configuration = BuildConfiguration([new KeyValuePair<string, string?>("Database:Provider", value)]);
        var environment = new TestHostEnvironment { EnvironmentName = Environments.Production };

        var provider = DatabaseProviderResolver.Resolve(configuration, environment);

        Assert.Equal(DatabaseProvider.InMemory, provider);
    }

    [Theory]
    [InlineData("PostgreSql")]
    [InlineData("Npgsql")]
    public void Resolve_SupportsPostgresAliases(string value)
    {
        var configuration = BuildConfiguration([new KeyValuePair<string, string?>("Database:Provider", value)]);
        var environment = new TestHostEnvironment { EnvironmentName = Environments.Production };

        var provider = DatabaseProviderResolver.Resolve(configuration, environment);

        Assert.Equal(DatabaseProvider.Postgres, provider);
    }

    [Fact]
    public void Resolve_DefaultsToInMemoryInDevelopment_WhenProviderNotConfigured()
    {
        var configuration = BuildConfiguration(Array.Empty<KeyValuePair<string, string?>>());
        var environment = new TestHostEnvironment { EnvironmentName = Environments.Development };

        var provider = DatabaseProviderResolver.Resolve(configuration, environment);

        Assert.Equal(DatabaseProvider.InMemory, provider);
    }

    [Fact]
    public void Resolve_ThrowsInvalidOperationException_WhenProviderMissingInProduction()
    {
        var configuration = BuildConfiguration(Array.Empty<KeyValuePair<string, string?>>());
        var environment = new TestHostEnvironment { EnvironmentName = Environments.Production };

        Assert.Throws<InvalidOperationException>(() => DatabaseProviderResolver.Resolve(configuration, environment));
    }

    [Fact]
    public void ParseProvider_ThrowsInvalidOperationException_ForUnsupportedProvider()
    {
        Assert.Throws<InvalidOperationException>(() => DatabaseProviderResolver.ParseProvider("sqlserver"));
    }

    private static IConfiguration BuildConfiguration(IEnumerable<KeyValuePair<string, string?>> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Production;
        public string ApplicationName { get; set; } = typeof(DatabaseProviderResolverTests).Assembly.GetName().Name!;
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
