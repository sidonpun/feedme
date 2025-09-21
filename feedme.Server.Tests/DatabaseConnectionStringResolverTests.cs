using System;
using System.Collections.Generic;
using feedme.Server.Configuration;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Xunit;

namespace feedme.Server.Tests;

public sealed class DatabaseConnectionStringResolverTests
{
    [Fact]
    public void Resolve_Throws_WhenConnectionStringIsMissing()
    {
        var configuration = BuildConfiguration([]);

        var exception = Assert.Throws<InvalidOperationException>(() => DatabaseConnectionStringResolver.Resolve(configuration));

        Assert.Contains("WarehouseDb", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Resolve_AppliesConfigurationOverrides()
    {
        const string baseConnectionString = "Host=localhost;Port=5432;Database=feedme;Username=postgres;Password=postgres";

        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:WarehouseDb"] = baseConnectionString,
            ["Database:Password"] = "secure-password",
            ["Database:Port"] = "6543"
        });

        var connectionString = DatabaseConnectionStringResolver.Resolve(configuration);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("secure-password", builder.Password);
        Assert.Equal(6543, builder.Port);
    }

    [Fact]
    public void Resolve_PrioritisesEnvironmentVariables()
    {
        const string baseConnectionString = "Host=localhost;Port=5432;Database=feedme;Username=postgres;Password=postgres";

        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:WarehouseDb"] = baseConnectionString,
            ["Database:Password"] = "configuration-secret"
        });

        using var scope = new EnvironmentVariableScope(("PGPASSWORD", "environment-secret"));

        var connectionString = DatabaseConnectionStringResolver.Resolve(configuration);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("environment-secret", builder.Password);
    }

    [Fact]
    public void Resolve_UsesDatabaseUrlOverride()
    {
        const string baseConnectionString = "Host=localhost;Port=5432;Database=feedme;Username=postgres;Password=postgres";

        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["ConnectionStrings:WarehouseDb"] = baseConnectionString,
            ["Database:Url"] = "postgres://override-user:override-password@remote-host:5433/override-database?sslmode=Require"
        });

        var connectionString = DatabaseConnectionStringResolver.Resolve(configuration);
        var builder = new NpgsqlConnectionStringBuilder(connectionString);

        Assert.Equal("remote-host", builder.Host);
        Assert.Equal(5433, builder.Port);
        Assert.Equal("override-database", builder.Database);
        Assert.Equal("override-user", builder.Username);
        Assert.Equal("override-password", builder.Password);
        Assert.Equal(SslMode.Require, builder.SslMode);
    }

    private static IConfiguration BuildConfiguration(IEnumerable<KeyValuePair<string, string?>> values)
    {
        var configurationBuilder = new ConfigurationBuilder();
        configurationBuilder.AddInMemoryCollection(values);

        return configurationBuilder.Build();
    }

    private sealed class EnvironmentVariableScope : IDisposable
    {
        private readonly (string Key, string? Value)[] _originalValues;

        public EnvironmentVariableScope(params (string Key, string? Value)[] variables)
        {
            _originalValues = new (string Key, string? Value)[variables.Length];

            for (var index = 0; index < variables.Length; index++)
            {
                var (key, value) = variables[index];

                _originalValues[index] = (key, Environment.GetEnvironmentVariable(key));
                Environment.SetEnvironmentVariable(key, value);
            }
        }

        public void Dispose()
        {
            foreach (var (key, value) in _originalValues)
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
