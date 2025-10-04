using System;
using System.Linq;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Options;

namespace feedme.Server.Configuration;

public sealed class CorsPolicyConfigurator : IConfigureNamedOptions<CorsOptions>
{
    private readonly CorsSettings _settings;

    public CorsPolicyConfigurator(IOptions<CorsSettings> corsOptions)
    {
        ArgumentNullException.ThrowIfNull(corsOptions);
        _settings = corsOptions.Value;
    }

    public void Configure(string? name, CorsOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var policyBuilder = new CorsPolicyBuilder();
        var allowedOrigins = _settings.GetSanitizedOrigins();

        if (allowedOrigins.Count > 0)
        {
            var originMatchers = allowedOrigins
                .Select(CorsOriginMatcher.TryCreate)
                .ToArray();

            if (originMatchers.Any(matcher => matcher is null))
            {
                policyBuilder.WithOrigins(allowedOrigins.ToArray());
            }
            else
            {
                var matchers = originMatchers
                    .Select(matcher => matcher!)
                    .ToArray();

                policyBuilder.SetIsOriginAllowed(origin =>
                    matchers.Any(matcher => matcher.Matches(origin)));
            }
        }
        else
        {
            policyBuilder.AllowAnyOrigin();
        }

        policyBuilder
            .AllowAnyHeader()
            .AllowAnyMethod();

        options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
    }

    public void Configure(CorsOptions options)
    {
        Configure(null, options);
    }
}
