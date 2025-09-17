using feedme.Server.Data;
using feedme.Server.Extensions;
using feedme.Server.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace feedme.Server;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.AddServiceDefaults();

        // Add services to the container.

        builder.Services.AddControllers();
        builder.Services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var provider = configuration["Database:Provider"];

            if (string.Equals(provider, "InMemory", StringComparison.OrdinalIgnoreCase))
            {
                var databaseName = configuration["Database:InMemoryName"] ?? "feedme-tests";
                options.UseInMemoryDatabase(databaseName);
                return;
            }

            var connectionString = configuration.GetConnectionString(AppDbContext.ConnectionStringName);

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException($"Connection string '{AppDbContext.ConnectionStringName}' is not configured.");
            }

            options.UseNpgsql(connectionString);
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
}
