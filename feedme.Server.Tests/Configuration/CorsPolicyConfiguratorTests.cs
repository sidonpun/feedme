using feedme.Server.Configuration;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Options;
using Xunit;

namespace feedme.Server.Tests.Configuration;

public class CorsPolicyConfiguratorTests
{
    [Fact]
    public void Configure_WithWildcardPortOrigin_AllowsAnyPortForHost()
    {
        var settings = new CorsSettings
        {
            AllowedOrigins = new[]
            {
                "http://localhost:*",
                "http://185.251.90.40"
            }
        };

        var corsOptions = new CorsOptions();
        var configurator = new CorsPolicyConfigurator(Options.Create(settings));

        configurator.Configure(CorsSettings.PolicyName, corsOptions);

        var policy = corsOptions.GetPolicy(CorsSettings.PolicyName);

        Assert.NotNull(policy);
        Assert.Contains("http://185.251.90.40", policy!.Origins);

        Assert.DoesNotContain("http://localhost:*", policy.Origins);
        Assert.True(policy.SupportsCredentials);
        Assert.True(policy.IsOriginAllowed("http://185.251.90.40"));

        Assert.True(policy.IsOriginAllowed("http://localhost:63191"));
        Assert.True(policy.IsOriginAllowed("http://localhost:4200"));
        Assert.False(policy.IsOriginAllowed("http://malicious.local"));
    }

    [Fact]
    public void Configure_WithExplicitOrigins_RegistersConfiguredOrigins()
    {
        var settings = new CorsSettings
        {
            AllowedOrigins = new[]
            {
                "http://localhost:4200",
                "http://185.251.90.40:8080"
            }
        };

        var corsOptions = new CorsOptions();
        var configurator = new CorsPolicyConfigurator(Options.Create(settings));

        configurator.Configure(CorsSettings.PolicyName, corsOptions);

        var policy = corsOptions.GetPolicy(CorsSettings.PolicyName);

        Assert.NotNull(policy);
        Assert.Contains("http://localhost:4200", policy!.Origins);
        Assert.Contains("http://185.251.90.40:8080", policy.Origins);

        Assert.True(policy.SupportsCredentials);

        Assert.True(policy.IsOriginAllowed("http://localhost:4200"));
        Assert.False(policy.IsOriginAllowed("http://localhost:5200"));
    }
}
