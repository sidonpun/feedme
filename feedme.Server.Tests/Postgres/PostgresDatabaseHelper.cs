using System;
using System.Threading.Tasks;
using Npgsql;
using Xunit.Sdk;

namespace feedme.Server.Tests.Postgres;

internal static class PostgresDatabaseHelper
{
    private const string AdminConnectionString = "Host=localhost;Port=5432;Database=postgres;Username=feedme;Password=feedme";

    public static async Task<string> CreateDatabaseAsync()
    {
        var databaseName = $"feedme_tests_{Guid.NewGuid():N}";
        await using var connection = new NpgsqlConnection(AdminConnectionString);
        await connection.OpenAsync();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = $"CREATE DATABASE \"{databaseName}\" OWNER feedme";
            await command.ExecuteNonQueryAsync();
        }

        return databaseName;
    }

    public static async Task DropDatabaseAsync(string databaseName)
    {
        await using var connection = new NpgsqlConnection(AdminConnectionString);
        await connection.OpenAsync();
        await using (var terminate = connection.CreateCommand())
        {
            terminate.CommandText =
                $"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{databaseName.Replace("'", "''")}'";
            await terminate.ExecuteNonQueryAsync();
        }

        await using (var command = connection.CreateCommand())
        {
            command.CommandText = $"DROP DATABASE IF EXISTS \"{databaseName}\"";
            await command.ExecuteNonQueryAsync();
        }
    }

    public static async Task RemoveExpiryDateColumnAsync(string connectionString)
    {
        const int maxAttempts = 40;
        const int delayMilliseconds = 500;

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = "ALTER TABLE IF EXISTS public.receipt_lines DROP COLUMN IF EXISTS expiry_date";

            try
            {
                await command.ExecuteNonQueryAsync();
                return;
            }
            catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.UndefinedTable)
            {
                if (attempt == maxAttempts - 1)
                {
                    throw new XunitException("Таблица 'receipt_lines' так и не появилась в отведённое время");
                }

                await Task.Delay(delayMilliseconds);
            }
        }
    }

    public static async Task<bool> TryEnsureServerAsync()
    {
        try
        {
            await using var connection = new NpgsqlConnection(AdminConnectionString);
            await connection.OpenAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
