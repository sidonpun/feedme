using System.Reflection;
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
        const string providerAssemblyName = "Microsoft.EntityFrameworkCore.InMemory";
        var databaseName = databaseOptions.ResolveInMemoryDatabaseName();

        var providerAssembly = ResolveAssembly(providerAssemblyName);
        var extensionType = providerAssembly.GetType("Microsoft.EntityFrameworkCore.InMemoryDbContextOptionsExtensions")
                              ?? throw new InvalidOperationException(
                                  $"The in-memory provider assembly '{providerAssemblyName}' does not expose the expected configuration API.");

        var useInMemoryMethod = extensionType.GetMethods(BindingFlags.Public | BindingFlags.Static)
            .FirstOrDefault(IsInMemoryConfigurationMethod)
                             ?? throw new InvalidOperationException(
                                 "Unable to locate the Entity Framework Core in-memory configuration method. Ensure the provider package version matches the application's Entity Framework Core version.");

        var parameters = useInMemoryMethod.GetParameters().Length switch
        {
            2 => new object?[] { options, databaseName },
            3 => new object?[] { options, databaseName, null },
            _ => throw new InvalidOperationException("Unsupported in-memory configuration method signature detected.")
        };

        useInMemoryMethod.Invoke(null, parameters);
    }

    private static Assembly ResolveAssembly(string assemblyName)
    {
        var existingAssembly = AppDomain.CurrentDomain
            .GetAssemblies()
            .FirstOrDefault(assembly => string.Equals(assembly.GetName().Name, assemblyName, StringComparison.Ordinal));

        if (existingAssembly is not null)
        {
            return existingAssembly;
        }

        try
        {
            return Assembly.Load(new AssemblyName(assemblyName));
        }
        catch (Exception exception)
        {
            throw new InvalidOperationException(
                $"Unable to load the Entity Framework Core in-memory provider '{assemblyName}'. Ensure the 'Microsoft.EntityFrameworkCore.InMemory' package is referenced by the application.",
                exception);
        }
    }

    private static bool IsInMemoryConfigurationMethod(MethodInfo method)
    {
        if (!string.Equals(method.Name, "UseInMemoryDatabase", StringComparison.Ordinal))
        {
            return false;
        }

        var parameters = method.GetParameters();
        if (parameters.Length < 2)
        {
            return false;
        }

        return parameters[0].ParameterType == typeof(DbContextOptionsBuilder)
               && parameters[1].ParameterType == typeof(string);
    }
}
