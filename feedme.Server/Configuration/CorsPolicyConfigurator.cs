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

        var policyBuilder = new CorsPolicyBuilder();
        var allowedOrigins = _settings.GetSanitizedOrigins();

        if (allowedOrigins.Count == 0)
        {
            policyBuilder.AllowAnyOrigin();
            policyBuilder
                .AllowAnyHeader()
                .AllowAnyMethod();

            options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
            return;
        }

        var originRules = CreateOriginRules(allowedOrigins);

        if (originRules.AllowedOrigins.Count > 0)
        {
            policyBuilder.WithOrigins(originRules.AllowedOrigins.ToArray());
        }

        policyBuilder
            .SetIsOriginAllowed(origin => originRules.IsAllowed(origin))
            .AllowAnyHeader()
            .AllowAnyMethod();

        options.AddPolicy(CorsSettings.PolicyName, policyBuilder.Build());
    }

    public void Configure(CorsOptions options)
    {
        Configure(null, options);
    }

    private static CorsOriginRuleSet CreateOriginRules(IReadOnlyCollection<string> configuredOrigins)
    {
        var rules = new List<CorsOriginRule>();
        var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var containsWildcardRule = false;

        foreach (var origin in configuredOrigins)
        {
            if (!CorsOriginRule.TryCreate(origin, out var rule) || rule is null)
            {
                continue;
            }

            rules.Add(rule);

            if (rule.AllowsAnyPort)
            {
                containsWildcardRule = true;
                continue;
            }

            allowedOrigins.Add(rule.NormalizedOrigin);
        }

        return new CorsOriginRuleSet(rules, allowedOrigins, containsWildcardRule);
    }

    private sealed class CorsOriginRuleSet
    {
        private readonly IReadOnlyCollection<CorsOriginRule> _rules;
        private readonly HashSet<string> _allowedOrigins;

        public CorsOriginRuleSet(
            IReadOnlyCollection<CorsOriginRule> rules,
            HashSet<string> allowedOrigins,
            bool containsWildcardRule)
        {
            _rules = rules;
            _allowedOrigins = allowedOrigins;
            ContainsWildcardRule = containsWildcardRule;
        }

        public IReadOnlyCollection<string> AllowedOrigins => _allowedOrigins;

        public bool ContainsWildcardRule { get; }

        public bool IsAllowed(string origin)
        {
            if (_allowedOrigins.Contains(origin))
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
