using System.Globalization;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace feedme.Server.Configuration;

public static class PostgresConnectionStringFactory
{
    private const string FallbackConnectionStringName = "Default";

    public static string Create(IConfiguration configuration, string connectionStringName)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionStringName);

        var baseConnectionString = ResolveBaseConnectionString(configuration, connectionStringName);
        var builder = new NpgsqlConnectionStringBuilder(baseConnectionString);

        ApplyOverrides(builder, configuration);

        return builder.ConnectionString;
    }

    private static string ResolveBaseConnectionString(IConfiguration configuration, string connectionStringName)
    {
        var primaryConnectionString = configuration.GetConnectionString(connectionStringName);

        if (!string.IsNullOrWhiteSpace(primaryConnectionString))
        {
            return primaryConnectionString;
        }

        var fallbackConnectionString = configuration.GetConnectionString(FallbackConnectionStringName);

        if (!string.IsNullOrWhiteSpace(fallbackConnectionString))
        {
            return fallbackConnectionString;
        }

        throw new InvalidOperationException(
            $"Connection string '{connectionStringName}' is not configured. Provide the '{connectionStringName}' connection string or configure the '{FallbackConnectionStringName}' fallback connection string via configuration or environment variables.");
    }

    private static void ApplyOverrides(NpgsqlConnectionStringBuilder builder, IConfiguration configuration)
    {
        var host = FirstNonEmpty(
            configuration["Database:Host"],
            configuration["POSTGRES_HOST"]);

        if (!string.IsNullOrWhiteSpace(host))
        {
            builder.Host = host;
        }

        var portValue = FirstNonEmpty(
            configuration["Database:Port"],
            configuration["POSTGRES_PORT"]);

        if (!string.IsNullOrWhiteSpace(portValue))
        {
            if (!int.TryParse(portValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var port) || port <= 0)
            {
                throw new InvalidOperationException("The configured database port must be a positive integer value.");
            }

            builder.Port = port;
        }

        var databaseName = FirstNonEmpty(
            configuration["Database:Name"],
            configuration["Database:Database"],
            configuration["POSTGRES_DB"]);

        if (!string.IsNullOrWhiteSpace(databaseName))
        {
            builder.Database = databaseName;
        }

        var username = FirstNonEmpty(
            configuration["Database:Username"],
            configuration["Database:User"],
            configuration["POSTGRES_USER"]);

        if (!string.IsNullOrWhiteSpace(username))
        {
            builder.Username = username;
        }

        var password = FirstNonEmpty(
            configuration["Database:Password"],
            configuration["POSTGRES_PASSWORD"]);

        if (!string.IsNullOrEmpty(password))
        {
            builder.Password = password;
        }

        var sslMode = FirstNonEmpty(
            configuration["Database:SslMode"],
            configuration["POSTGRES_SSLMODE"]);

        if (!string.IsNullOrWhiteSpace(sslMode))
        {
            builder.SslMode = ParseSslMode(sslMode);
        }
    }

    private static SslMode ParseSslMode(string value)
    {
        if (Enum.TryParse<SslMode>(value, true, out var parsedValue))
        {
            return parsedValue;
        }

        throw new InvalidOperationException($"Unsupported SSL mode '{value}' configured for the database connection.");
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }
}
