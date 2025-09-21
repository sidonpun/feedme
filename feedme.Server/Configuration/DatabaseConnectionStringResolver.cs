using System;
using System.Globalization;
using feedme.Server.Data;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace feedme.Server.Configuration;

internal static class DatabaseConnectionStringResolver
{
    private const string DatabaseSectionName = "Database";
    private const string FallbackConnectionName = "Default";

    public static string Resolve(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var baseConnectionString = ResolveBaseConnectionString(configuration);

        var builder = new NpgsqlConnectionStringBuilder(baseConnectionString);

        builder = ApplyDatabaseUrlOverride(builder, configuration);

        ApplyConfigurationOverrides(builder, configuration);
        ApplyEnvironmentOverrides(builder, configuration);

        return builder.ConnectionString;
    }

    private static string ResolveBaseConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(AppDbContext.ConnectionStringName);

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        var fallbackConnectionString = configuration.GetConnectionString(FallbackConnectionName);

        if (!string.IsNullOrWhiteSpace(fallbackConnectionString))
        {
            return fallbackConnectionString;
        }

        throw new InvalidOperationException(
            $"Connection string '{AppDbContext.ConnectionStringName}' is not configured. Provide the '{AppDbContext.ConnectionStringName}' connection string or configure the '{FallbackConnectionName}' fallback connection string via configuration or environment variables.");
    }

    private static NpgsqlConnectionStringBuilder ApplyDatabaseUrlOverride(
        NpgsqlConnectionStringBuilder builder,
        IConfiguration configuration)
    {
        var databaseUrl = configuration[$"{DatabaseSectionName}:Url"]
                         ?? configuration["DATABASE_URL"]
                         ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        if (string.IsNullOrWhiteSpace(databaseUrl))
        {
            return builder;
        }

        if (TryApplyUrlFormat(builder, databaseUrl))
        {
            return builder;
        }

        var overrideBuilder = new NpgsqlConnectionStringBuilder(databaseUrl);

        foreach (string key in overrideBuilder.Keys)
        {
            builder[key] = overrideBuilder[key];
        }

        return builder;
    }

    private static void ApplyConfigurationOverrides(NpgsqlConnectionStringBuilder builder, IConfiguration configuration)
    {
        var databaseSection = configuration.GetSection(DatabaseSectionName);

        if (!databaseSection.Exists())
        {
            return;
        }

        ApplyStringOverride(databaseSection["Host"], value => builder.Host = value);
        ApplyStringOverride(databaseSection["Database"], value => builder.Database = value);
        ApplyStringOverride(databaseSection["Username"], value => builder.Username = value);
        ApplyStringOverride(databaseSection["Password"], value => builder.Password = value);
        ApplyStringOverride(databaseSection["ApplicationName"], value => builder.ApplicationName = value);
        ApplyStringOverride(databaseSection["SearchPath"], value => builder.SearchPath = value);

        ApplyPortOverride(databaseSection["Port"], builder, $"{DatabaseSectionName}:Port");
        ApplySslModeOverride(databaseSection["SslMode"], builder, $"{DatabaseSectionName}:SslMode");
        ApplyBooleanOverride(
            databaseSection["TrustServerCertificate"],
            builder,
            $"{DatabaseSectionName}:TrustServerCertificate",
            value => builder["Trust Server Certificate"] = value);
    }

    private static void ApplyEnvironmentOverrides(NpgsqlConnectionStringBuilder builder, IConfiguration configuration)
    {
        string? ResolveEnvironmentValue(string key) => configuration[key] ?? Environment.GetEnvironmentVariable(key);

        ApplyStringOverride(ResolveEnvironmentValue("PGHOST"), value => builder.Host = value);
        ApplyStringOverride(ResolveEnvironmentValue("PGDATABASE"), value => builder.Database = value);
        ApplyStringOverride(ResolveEnvironmentValue("PGUSER"), value => builder.Username = value);
        ApplyStringOverride(ResolveEnvironmentValue("PGPASSWORD"), value => builder.Password = value);

        ApplyStringOverride(ResolveEnvironmentValue("POSTGRES_DB"), value => builder.Database = value);
        ApplyStringOverride(ResolveEnvironmentValue("POSTGRES_USER"), value => builder.Username = value);
        ApplyStringOverride(ResolveEnvironmentValue("POSTGRES_PASSWORD"), value => builder.Password = value);

        ApplyPortOverride(ResolveEnvironmentValue("PGPORT"), builder, "PGPORT");
        ApplySslModeOverride(ResolveEnvironmentValue("PGSSLMODE"), builder, "PGSSLMODE");

        var trustServerCertificateValue = ResolveEnvironmentValue("PG_TRUST_SERVER_CERTIFICATE")
                                         ?? ResolveEnvironmentValue("POSTGRES_TRUST_SERVER_CERTIFICATE");

        ApplyBooleanOverride(
            trustServerCertificateValue,
            builder,
            "PG_TRUST_SERVER_CERTIFICATE or POSTGRES_TRUST_SERVER_CERTIFICATE",
            value => builder["Trust Server Certificate"] = value);
    }

    private static bool TryApplyUrlFormat(NpgsqlConnectionStringBuilder builder, string databaseUrl)
    {
        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!uri.Scheme.StartsWith("postgres", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.IsNullOrEmpty(uri.Host))
        {
            builder.Host = uri.Host;
        }

        if (uri.Port > 0)
        {
            builder.Port = uri.Port;
        }

        var databaseName = Uri.UnescapeDataString(uri.AbsolutePath).Trim('/');
        if (!string.IsNullOrWhiteSpace(databaseName))
        {
            builder.Database = databaseName;
        }

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var credentials = uri.UserInfo.Split(':', 2);

            if (!string.IsNullOrWhiteSpace(credentials[0]))
            {
                builder.Username = Uri.UnescapeDataString(credentials[0]);
            }

            if (credentials.Length == 2 && !string.IsNullOrWhiteSpace(credentials[1]))
            {
                builder.Password = Uri.UnescapeDataString(credentials[1]);
            }
        }

        var query = uri.Query.TrimStart('?');
        if (!string.IsNullOrWhiteSpace(query))
        {
            var parameters = query.Split('&', StringSplitOptions.RemoveEmptyEntries);

            foreach (var parameter in parameters)
            {
                var segments = parameter.Split('=', 2);
                var key = Uri.UnescapeDataString(segments[0]);
                var value = segments.Length == 2 ? Uri.UnescapeDataString(segments[1]) : string.Empty;

                builder[key] = value;
            }
        }

        return true;
    }

    private static void ApplyStringOverride(string? value, Action<string> apply)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        apply(value);
    }

    private static void ApplyPortOverride(string? value, NpgsqlConnectionStringBuilder builder, string sourceKey)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var port) || port <= 0)
        {
            throw new InvalidOperationException($"Configuration value '{sourceKey}' must be a positive integer.");
        }

        builder.Port = port;
    }

    private static void ApplyBooleanOverride(
        string? value,
        NpgsqlConnectionStringBuilder builder,
        string sourceKey,
        Action<bool> apply)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (!bool.TryParse(value, out var parsedValue))
        {
            throw new InvalidOperationException($"Configuration value '{sourceKey}' must be either 'true' or 'false'.");
        }

        apply(parsedValue);
    }

    private static void ApplySslModeOverride(string? value, NpgsqlConnectionStringBuilder builder, string sourceKey)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (!Enum.TryParse(value, true, out SslMode sslMode))
        {
            throw new InvalidOperationException($"Configuration value '{sourceKey}' must match one of the supported SSL modes defined by '{nameof(SslMode)}'.");
        }

        builder.SslMode = sslMode;
    }
}
