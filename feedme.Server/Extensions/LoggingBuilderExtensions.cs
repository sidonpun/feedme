using System;
using System.IO;
using feedme.Server.Configuration;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Json;

namespace feedme.Server.Extensions;

public static class LoggingBuilderExtensions
{
    public static void ConfigureServerLogging(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Host.UseSerilog((context, services, loggerConfiguration) =>
        {
            var fileOptions = context.Configuration
                .GetSection(FileLoggingOptions.SectionName)
                .Get<FileLoggingOptions>() ?? new FileLoggingOptions();

            var logDirectory = ResolveLogDirectory(fileOptions.Directory);
            var rollingInterval = ResolveRollingInterval(fileOptions.RollingInterval);
            var logFilePath = Path.Combine(logDirectory, $"{fileOptions.FileName}-.json");

            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Application", context.HostingEnvironment.ApplicationName)
                .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.AspNetCore.Hosting.Diagnostics", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.AspNetCore.Routing.EndpointMiddleware", LogEventLevel.Warning)
                .WriteTo.Console()
                .WriteTo.Async(writeTo =>
                    writeTo.File(
                        formatter: new JsonFormatter(renderMessage: true),
                        path: logFilePath,
                        rollingInterval: rollingInterval,
                        retainedFileCountLimit: fileOptions.RetainedFileCountLimit,
                        fileSizeLimitBytes: fileOptions.FileSizeLimitBytes,
                        rollOnFileSizeLimit: true,
                        shared: true,
                        flushToDiskInterval: fileOptions.FlushInterval));
        });
    }

    private static string ResolveLogDirectory(string? configuredDirectory)
    {
        var directoryPath = string.IsNullOrWhiteSpace(configuredDirectory)
            ? Path.Combine(AppContext.BaseDirectory, "Logs")
            : configuredDirectory!;

        return Directory.CreateDirectory(directoryPath).FullName;
    }

    private static RollingInterval ResolveRollingInterval(string? configuredInterval)
    {
        if (string.IsNullOrWhiteSpace(configuredInterval))
        {
            return RollingInterval.Day;
        }

        if (Enum.TryParse<RollingInterval>(configuredInterval, true, out var rollingInterval))
        {
            return rollingInterval;
        }

        throw new InvalidOperationException(
            $"Unsupported log rolling interval '{configuredInterval}'. See {nameof(RollingInterval)} for allowed values.");
    }
}
