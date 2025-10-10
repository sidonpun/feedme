using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Runtime.Loader;
using System.Security.Cryptography;
using System.Text;
using feedme.Server.Configuration;
using feedme.Server.Data;
using feedme.Server.Extensions;
using feedme.Server.Repositories;
using Microsoft.AspNetCore.Cors.Infrastructure;
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
        builder.ConfigureServerLogging();
        builder.AddServiceDefaults();

        // Add services to the container.

        builder.Services.AddControllers();
        builder.Services
            .AddOptions<DatabaseOptions>()
            .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName));
        builder.Services
            .AddOptions<CorsSettings>()
            .Bind(builder.Configuration.GetSection(CorsSettings.SectionName));

        builder.Services.AddCors();
        builder.Services.AddSingleton<IConfigureOptions<CorsOptions>, CorsPolicyConfigurator>();

        builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var hostEnvironment = serviceProvider.GetRequiredService<IHostEnvironment>();
            var databaseOptions = serviceProvider.GetRequiredService<IOptions<DatabaseOptions>>().Value;

            var fallbackProvider = DatabaseProvider.Postgres;
            var resolvedProvider = databaseOptions.ResolveProvider(fallbackProvider);

            if (resolvedProvider == DatabaseProvider.Postgres
                && string.IsNullOrWhiteSpace(databaseOptions.Provider)
                && !hostEnvironment.IsDevelopment())
            {
                var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
                logger.LogWarning(
                    "Database provider is not configured. Using the default PostgreSQL provider in the '{Environment}' environment.",
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
        builder.Services.AddScoped<IInventoryRepository, PostgresInventoryRepository>();
        // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
        builder.Services.AddOpenApi();

        builder.Services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>();

        var app = builder.Build();

        app.MapDefaultEndpoints();

        app.UseDefaultFiles();
        app.MapStaticAssets();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.Use((context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var configuration = context.RequestServices.GetRequiredService<IConfiguration>();
                var contentSecurityPolicy = BuildContentSecurityPolicy(configuration);
                context.Response.Headers["Content-Security-Policy"] = contentSecurityPolicy;
                return Task.CompletedTask;
            });

            return next();
        });

        app.UseRouting();

        app.UseCors(CorsSettings.PolicyName);

        app.MapControllers();

        app.MapGet(
            "/.well-known/appspecific/com.chrome.devtools.json",
            (IHostEnvironment environment, IConfiguration configuration) =>
            {
                var workspaceRoot = ResolveWorkspaceRootPath(environment, configuration);
                var workspaceUuid = ResolveWorkspaceUuid(workspaceRoot, configuration);

                var payload = new
                {
                    workspace = new
                    {
                        root = workspaceRoot,
                        uuid = workspaceUuid
                    }
                };

                return Results.Json(payload);
            });

        app.MapFallbackToFile("/index.html");

        await app.ApplyMigrationsAsync();
        await app.SeedDatabaseAsync();

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

    private static string ResolveWorkspaceRootPath(IHostEnvironment environment, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(configuration);

        var configuredRoot = configuration["DevToolsWorkspace:RootPath"];

        if (string.IsNullOrWhiteSpace(configuredRoot))
        {
            return NormalizePath(environment.ContentRootPath);
        }

        var expanded = configuredRoot.Replace(
            "{ContentRoot}",
            environment.ContentRootPath,
            StringComparison.OrdinalIgnoreCase);

        expanded = Environment.ExpandEnvironmentVariables(expanded);

        if (!Path.IsPathRooted(expanded))
        {
            expanded = Path.Combine(environment.ContentRootPath, expanded);
        }

        return NormalizePath(expanded);
    }

    private static string ResolveWorkspaceUuid(string workspaceRoot, IConfiguration configuration)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(workspaceRoot);
        ArgumentNullException.ThrowIfNull(configuration);

        var configuredUuid = configuration["DevToolsWorkspace:Uuid"];

        if (Guid.TryParse(configuredUuid, out var parsedUuid))
        {
            return parsedUuid.ToString();
        }

        return CreateDeterministicGuid(workspaceRoot).ToString();
    }

    private static Guid CreateDeterministicGuid(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        using var md5 = MD5.Create();
        var normalized = NormalizePath(value).ToUpperInvariant();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(normalized));
        return new Guid(hash);
    }

    private static string NormalizePath(string path)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        var fullPath = Path.GetFullPath(path);
        return Path.TrimEndingDirectorySeparator(fullPath);
    }

    private static string BuildContentSecurityPolicy(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var connectSources = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "'self'",
            "http://localhost:*",
            "https://localhost:*",
            "http://127.0.0.1:*",
            "https://127.0.0.1:*",
            "ws://localhost:*",
            "wss://localhost:*",
            "ws://127.0.0.1:*",
            "wss://127.0.0.1:*"
        };

        var configuredOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        foreach (var origin in configuredOrigins)
        {
            if (!string.IsNullOrWhiteSpace(origin))
            {
                connectSources.Add(origin.Trim());
            }
        }

        var connectSrcValue = string.Join(' ', connectSources);

        var builder = new StringBuilder();
        builder.Append("default-src 'self'; ");
        builder.Append("connect-src ").Append(connectSrcValue).Append("; ");
        builder.Append("img-src 'self' data: blob:; ");
        builder.Append("script-src 'self' 'unsafe-inline' 'unsafe-eval'; ");
        builder.Append("style-src 'self' 'unsafe-inline'; ");
        builder.Append("font-src 'self' data:; ");
        builder.Append("object-src 'none'; ");
        builder.Append("base-uri 'self'; ");
        builder.Append("frame-ancestors 'self'; ");
        builder.Append("form-action 'self'; ");

        return builder.ToString().TrimEnd();
    }
}
