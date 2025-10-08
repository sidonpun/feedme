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
            policyBuilder
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();

            options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
            return;
        }

        var originRules = CreateOriginRules(sanitizedOrigins);

        if (!originRules.Rules.Any())
        {
            policyBuilder
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();

            options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
            return;
        }

        if (!originRules.ExplicitOrigins.IsEmpty)
        {
            policyBuilder.WithOrigins(originRules.ExplicitOrigins.ToArray());
        }

        policyBuilder
            .SetIsOriginAllowed(origin => originRules.IsAllowed(origin))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();

        options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
    }

    public void Configure(CorsOptions options)
    {
        Configure(null, options);
    }

    private static CorsOriginRuleSet CreateOriginRules(IReadOnlyCollection<string> configuredOrigins)
    {
        var rules = configuredOrigins
            .Select(origin => CorsOriginRule.TryCreate(origin, out var rule) ? rule : null)
            .Where(rule => rule is not null)
            .Cast<CorsOriginRule>()
            .ToImmutableArray();

        var explicitOrigins = rules
            .Where(rule => !rule.AllowsAnyPort)
            .Select(rule => rule.NormalizedOrigin)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToImmutableHashSet(StringComparer.OrdinalIgnoreCase);

        return new CorsOriginRuleSet(rules, explicitOrigins);
    }

    private sealed record CorsOriginRuleSet(
        ImmutableArray<CorsOriginRule> Rules,
        ImmutableHashSet<string> ExplicitOrigins)
    {
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

            foreach (var rule in Rules)
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
