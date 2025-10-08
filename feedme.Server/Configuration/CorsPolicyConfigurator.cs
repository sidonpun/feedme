using System;
using System.Collections.Generic;
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

        if (originRules.ExplicitOrigins.Count > 0)

        {
            policyBuilder.WithOrigins(originRules.ExplicitOrigins.ToArray());
        }

        policyBuilder
            .SetIsOriginAllowed(originRules.IsAllowed)
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
        var rules = new List<CorsOriginRule>();
        var explicitOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var origin in configuredOrigins)
        {
            if (!CorsOriginRule.TryCreate(origin, out var rule) || rule is null)
            {
                continue;
            }

            rules.Add(rule);

            if (!rule.AllowsAnyPort)
            {
                explicitOrigins.Add(rule.NormalizedOrigin);
            }
        }

        return new CorsOriginRuleSet(rules, explicitOrigins);
    }

    private sealed class CorsOriginRuleSet
    {
        private readonly IReadOnlyCollection<CorsOriginRule> _rules;
        private readonly HashSet<string> _explicitOrigins;

        public CorsOriginRuleSet(IReadOnlyCollection<CorsOriginRule> rules, HashSet<string> explicitOrigins)
        {
            _rules = rules;
            _explicitOrigins = explicitOrigins;
        }

        public IReadOnlyCollection<string> ExplicitOrigins => _explicitOrigins;

        public bool IsAllowed(string origin)
        {
            if (_explicitOrigins.Contains(origin))
            {
                return true;
            }

            if (_rules.Count == 0)
            {
                return false;
            }

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var parsedOrigin))
            {
                return false;
            }

            foreach (var rule in _rules)
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
