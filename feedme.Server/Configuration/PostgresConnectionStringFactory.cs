using System.Globalization;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace feedme.Server.Configuration;

public static class PostgresConnectionStringFactory
{
    private const string FallbackConnectionStringName = "Default";
    private static readonly string[] SupportedUriSchemes = ["postgres", "postgresql"];
    private const int DefaultPostgresPort = 5432;

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
        var overrideConnectionString = ResolveConnectionStringOverride(configuration, connectionStringName);

        if (!string.IsNullOrWhiteSpace(overrideConnectionString))
        {
            return NormalizeConnectionString(overrideConnectionString);
        }

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
            configuration["Database:Hostname"],
            configuration["POSTGRES_HOST"],
            configuration["DATABASE_HOST"],
            configuration["DB_HOST"],
            configuration["PGHOST"]);

        if (!string.IsNullOrWhiteSpace(host))
        {
            builder.Host = host;
        }

        var portValue = FirstNonEmpty(
            configuration["Database:Port"],
            configuration["POSTGRES_PORT"],
            configuration["DATABASE_PORT"],
            configuration["DB_PORT"],
            configuration["PGPORT"]);

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
            configuration["Database:Db"],
            configuration["POSTGRES_DB"],
            configuration["DATABASE_NAME"],
            configuration["DB_NAME"],
            configuration["PGDATABASE"]);

        if (!string.IsNullOrWhiteSpace(databaseName))
        {
            builder.Database = databaseName;
        }

        var username = FirstNonEmpty(
            configuration["Database:Username"],
            configuration["Database:User"],
            configuration["Database:Login"],
            configuration["POSTGRES_USER"],
            configuration["DATABASE_USERNAME"],
            configuration["DATABASE_USER"],
            configuration["DB_USERNAME"],
            configuration["DB_USER"],
            configuration["PGUSER"]);

        if (!string.IsNullOrWhiteSpace(username))
        {
            builder.Username = username;
        }

        var password = FirstNonEmpty(
            configuration["Database:Password"],
            configuration["POSTGRES_PASSWORD"],
            configuration["DATABASE_PASSWORD"],
            configuration["DB_PASSWORD"],
            configuration["PGPASSWORD"]);

        if (!string.IsNullOrEmpty(password))
        {
            builder.Password = password;
        }

        var sslMode = FirstNonEmpty(
            configuration["Database:SslMode"],
            configuration["POSTGRES_SSLMODE"],
            configuration["DATABASE_SSLMODE"],
            configuration["DB_SSLMODE"]);

        if (!string.IsNullOrWhiteSpace(sslMode))
        {
            builder.SslMode = ParseSslMode(sslMode);
        }
    }

    private static string? ResolveConnectionStringOverride(IConfiguration configuration, string connectionStringName)
    {
        var overrideValue = FirstNonEmpty(
            configuration["Database:ConnectionString"],
            configuration["Database:Connection"],
            configuration["Database:ConnectionUri"],
            configuration["Database:Uri"],
            configuration["Database:Url"],
            configuration[$"POSTGRESQLCONNSTR_{connectionStringName}"],
            configuration[$"SQLCONNSTR_{connectionStringName}"],
            configuration[$"PGCONNSTR_{connectionStringName}"],
            configuration["POSTGRES_CONNECTION_STRING"],
            configuration["POSTGRES_CONNECTION_URI"],
            configuration["POSTGRES_URL"],
            configuration["DATABASE_URL"],
            configuration["DB_CONNECTION_STRING"],
            configuration["DB_URL"]);

        return string.IsNullOrWhiteSpace(overrideValue) ? null : overrideValue;
    }

    private static string NormalizeConnectionString(string value)
    {
        var trimmed = value.Trim();

        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            return BuildConnectionStringFromUri(trimmed);
        }

        return trimmed;
    }

    private static string BuildConnectionStringFromUri(string uriValue)
    {
        if (!Uri.TryCreate(uriValue, UriKind.Absolute, out var uri))
        {
            throw new InvalidOperationException($"The database connection URI '{uriValue}' is not a valid absolute URI.");
        }

        if (!SupportedUriSchemes.Contains(uri.Scheme, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Unsupported database URI scheme '{uri.Scheme}'. Only the following schemes are supported: {string.Join(", ", SupportedUriSchemes)}.");
        }

        if (string.IsNullOrWhiteSpace(uri.Host))
        {
            throw new InvalidOperationException("The database connection URI must specify a host name.");
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? DefaultPostgresPort : uri.Port
        };

        var databaseName = uri.AbsolutePath.Trim('/');

        if (!string.IsNullOrWhiteSpace(databaseName))
        {
            builder.Database = Uri.UnescapeDataString(databaseName);
        }

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var userInfoParts = uri.UserInfo.Split(':', 2, StringSplitOptions.TrimEntries);
            builder.Username = Uri.UnescapeDataString(userInfoParts[0]);

            if (userInfoParts.Length > 1)
            {
                builder.Password = Uri.UnescapeDataString(userInfoParts[1]);
            }
        }

        ApplyQueryParameters(uri, builder);

        return builder.ConnectionString;
    }

    private static void ApplyQueryParameters(Uri uri, NpgsqlConnectionStringBuilder builder)
    {
        if (string.IsNullOrEmpty(uri.Query) || uri.Query.Length <= 1)
        {
            return;
        }

        var parameters = uri.Query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var parameter in parameters)
        {
            if (string.IsNullOrEmpty(parameter))
            {
                continue;
            }

            var parts = parameter.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]);
            var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;

            if (string.Equals(key, nameof(NpgsqlConnectionStringBuilder.Host), StringComparison.OrdinalIgnoreCase))
            {
                builder.Host = value;
                continue;
            }

            if (string.Equals(key, nameof(NpgsqlConnectionStringBuilder.Port), StringComparison.OrdinalIgnoreCase))
            {
                if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedPort) || parsedPort <= 0)
                {
                    throw new InvalidOperationException("The port value specified in the database connection URI query string must be a positive integer.");
                }

                builder.Port = parsedPort;
                continue;
            }

            if (string.Equals(key, nameof(NpgsqlConnectionStringBuilder.Database), StringComparison.OrdinalIgnoreCase))
            {
                builder.Database = value;
                continue;
            }

            if (string.Equals(key, nameof(NpgsqlConnectionStringBuilder.Username), StringComparison.OrdinalIgnoreCase))
            {
                builder.Username = value;
                continue;
            }

            if (string.Equals(key, nameof(NpgsqlConnectionStringBuilder.Password), StringComparison.OrdinalIgnoreCase))
            {
                builder.Password = value;
                continue;
            }

            builder[key] = value;
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
