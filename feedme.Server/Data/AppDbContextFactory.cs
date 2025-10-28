using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace feedme.Server.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string DefaultConnectionString = "Host=localhost;Port=5432;Database=feedme;Username=feedme;Password=feedme";

    public AppDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString =
            configuration.GetConnectionString(AppDbContext.ConnectionStringName) ??
            configuration["Database:ConnectionString"] ??
            BuildConnectionStringFromSections(configuration) ??
            DefaultConnectionString;

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }

    private static string? BuildConnectionStringFromSections(IConfiguration configuration)
    {
        var host = configuration["Database:Host"];
        var port = configuration["Database:Port"];
        var name = configuration["Database:Name"];
        var username = configuration["Database:Username"];
        var password = configuration["Database:Password"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var portSegment = string.IsNullOrWhiteSpace(port) ? string.Empty : $"Port={port};";
        var passwordSegment = string.IsNullOrWhiteSpace(password) ? string.Empty : $"Password={password};";

        return $"Host={host};{portSegment}Database={name};Username={username};{passwordSegment}".TrimEnd(';');
    }
}
