using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using feedme.Server.Configuration;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace feedme.Server.Tests;

public class CorsTests
{
    [Fact]
    public async Task PreflightRequest_ReturnsCorsHeadersForConfiguredOrigin()
    {
        await using var factory = new FeedmeApplicationFactory()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, configuration) =>
                {
                    configuration.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{CorsSettings.SectionName}:{nameof(CorsSettings.AllowedOrigins)}:0"] = "http://localhost:4200"
                    });
                });
            });

        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/receipts");
        request.Headers.Add("Origin", "http://localhost:4200");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:4200", origins);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Methods", out var methods));
        Assert.Contains(methods, value => !string.IsNullOrWhiteSpace(value));
    }

    [Fact]
    public async Task GetRequest_IncludesCorsHeaderForConfiguredOrigin()
    {
        await using var factory = new FeedmeApplicationFactory()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, configuration) =>
                {
                    configuration.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{CorsSettings.SectionName}:{nameof(CorsSettings.AllowedOrigins)}:0"] = "http://localhost:4200"
                    });
                });
            });

        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/receipts");
        request.Headers.Add("Origin", "http://localhost:4200");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:4200", origins);
    }

    [Fact]
    public async Task PreflightRequest_ReturnsCorsHeadersForWildcardPortOrigin()
    {
        await using var factory = new FeedmeApplicationFactory()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, configuration) =>
                {
                    configuration.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{CorsSettings.SectionName}:{nameof(CorsSettings.AllowedOrigins)}:0"] = "http://example.com:*"
                    });
                });
            });

        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/receipts");
        request.Headers.Add("Origin", "http://example.com:8080");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://example.com:8080", origins);
    }

    [Fact]
    public async Task PreflightRequest_ReturnsCorsHeadersForWildcardPortOrigin_WhenSpecificOriginsAreConfigured()
    {
        await using var factory = new FeedmeApplicationFactory()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, configuration) =>
                {
                    configuration.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        [$"{CorsSettings.SectionName}:{nameof(CorsSettings.AllowedOrigins)}:0"] = "http://localhost:4200",
                        [$"{CorsSettings.SectionName}:{nameof(CorsSettings.AllowedOrigins)}:1"] = "http://example.com:*"
                    });
                });
            });

        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/receipts");
        request.Headers.Add("Origin", "http://example.com:63191");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://example.com:63191", origins);
    }
}
