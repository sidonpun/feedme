using System.IO;
using System.Reflection;
using System.Runtime.Loader;
using feedme.Server.Configuration;
using feedme.Server.Data;
using feedme.Server.Extensions;
using feedme.Server.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace feedme.Server;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.AddServiceDefaults();

        // Add services to the container.

        builder.Services.AddControllers();
        builder.Services
            .AddOptions<DatabaseOptions>()
            .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName));

        builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var hostEnvironment = serviceProvider.GetRequiredService<IHostEnvironment>();
            var databaseOptions = serviceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;

            var fallbackProvider = DatabaseProvider.InMemory;
            var resolvedProvider = databaseOptions.ResolveProvider(fallbackProvider);

            if (!hostEnvironment.IsDevelopment() && string.IsNullOrWhiteSpace(databaseOptions.Provider))
            {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogWarning(
                    "Database provider is not configured. Falling back to the in-memory provider in the '{Environment}' environment.",
                    hostEnvironment.EnvironmentName);
            }

            switch (resolvedProvider)
            {
                case DatabaseProvider.InMemory:
                    ConfigureInMemoryDatabase(options, databaseOptions);
                    return;
                case DatabaseProvider.Postgres:
                    var connectionString = PostgresConnectionStringFactory.Create(
                        configuration,
                        AppDbContext.ConnectionStringName);

                    options.UseNpgsql(connectionString);
                    return;
                default:
                    throw new InvalidOperationException(
                        $"Unsupported database provider '{databaseOptions.Provider}'.");
            }
        });
        builder.Services.AddScoped<ICatalogRepository, PostgresCatalogRepository>();
        builder.Services.AddScoped<IReceiptRepository, PostgresReceiptRepository>();
        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        builder.Services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
                policy
                    .AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod());
        });

        var app = builder.Build();

        app.MapDefaultEndpoints();

        app.UseDefaultFiles();
        app.MapStaticAssets();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseCors("AllowAll");

        app.MapControllers();

        app.MapFallbackToFile("/index.html");

        await app.ApplyMigrationsAsync();

        await app.RunAsync();
    }

    private static void ConfigureInMemoryDatabase(DbContextOptionsBuilder options, DatabaseOptions databaseOptions)
    {
        EnsureAssemblyLoaded("Microsoft.EntityFrameworkCore.InMemory");

        var databaseName = databaseOptions.ResolveInMemoryDatabaseName();

        options.UseInMemoryDatabase(databaseName);
    }

    private static void EnsureAssemblyLoaded(string assemblyName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(assemblyName);

        try
        {
            Assembly.Load(assemblyName);
            return;
        }
        catch (FileNotFoundException)
        {
            var assemblyFilePath = Path.Combine(AppContext.BaseDirectory, $"{assemblyName}.dll");

            if (!File.Exists(assemblyFilePath))
            {
                throw new InvalidOperationException(
                    $"Unable to load the Entity Framework Core in-memory provider '{assemblyName}'. Ensure the '{assemblyName}' package is referenced by the application.");
            }

            AssemblyLoadContext.Default.LoadFromAssemblyPath(assemblyFilePath);
        }
    }
}
