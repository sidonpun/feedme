using System;
using System.Collections.Generic;
using System.Collections.Immutable;
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

        var sanitizedOrigins = _settings.GetSanitizedOrigins();

        var policyBuilder = new CorsPolicyBuilder();

        if (sanitizedOrigins.Count == 0)
        {
            ConfigureOpenCorsPolicy(policyBuilder);
            options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
            return;
        }

        var originRules = CreateOriginRules(sanitizedOrigins);

        if (!originRules.HasAnyRules)
        {
            ConfigureOpenCorsPolicy(policyBuilder);
            options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
            return;
        }

        if (!originRules.ExplicitOrigins.IsEmpty)
        {
            policyBuilder.WithOrigins(originRules.ExplicitOrigins.ToArray());
        }

        policyBuilder
            .SetIsOriginAllowed(originRules.IsAllowed)
            .AllowAnyHeader()
            .AllowAnyMethod();

        if (originRules.SupportsCredentials)
        {
            policyBuilder.AllowCredentials();
        }

        options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
    }

    public void Configure(CorsOptions options)
    {
        Configure(null, options);
    }

    private static CorsOriginRuleSet CreateOriginRules(IReadOnlyCollection<string> configuredOrigins)
    {
        var validRules = configuredOrigins
            .Select(origin => CorsOriginRule.TryCreate(origin, out var rule) ? rule : null)
            .Where(rule => rule is not null)
            .Cast<CorsOriginRule>()
            .ToImmutableArray();

        var explicitRules = validRules
            .Where(rule => !rule.AllowsAnyPort)
            .ToImmutableArray();

        var wildcardRules = validRules
            .Where(rule => rule.AllowsAnyPort)
            .ToImmutableArray();

        var explicitOrigins = explicitRules
            .Select(rule => rule.NormalizedOrigin)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToImmutableHashSet(StringComparer.OrdinalIgnoreCase);

        return new CorsOriginRuleSet(explicitRules, wildcardRules, explicitOrigins);
    }

    private static void ConfigureOpenCorsPolicy(CorsPolicyBuilder builder)
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    }

    private sealed record CorsOriginRuleSet(
        ImmutableArray<CorsOriginRule> ExplicitRules,
        ImmutableArray<CorsOriginRule> WildcardRules,
        ImmutableHashSet<string> ExplicitOrigins)
    {

        public bool HasAnyRules => ExplicitRules.Length > 0 || WildcardRules.Length > 0;

        public bool SupportsCredentials => HasAnyRules;

        public bool IsAllowed(string? origin)
        {
            if (string.IsNullOrWhiteSpace(origin))

            {
                return false;
            }

            if (ExplicitOrigins.Contains(origin))
            {
                return true;
            }

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var parsedOrigin))
            {
                return false;
            }

            foreach (var rule in ExplicitRules)
            {
                if (rule.Matches(parsedOrigin))
                {
                    return true;
                }
            }

            foreach (var rule in WildcardRules)
            {
                if (rule.Matches(parsedOrigin))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
