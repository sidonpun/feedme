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

        if (originRules.ExactOrigins.Count > 0)
        {
            policyBuilder.WithOrigins(originRules.ExactOrigins.ToArray());
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
        var exactOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var wildcardRules = new List<CorsOriginRule>();

        foreach (var origin in configuredOrigins)
        {
            if (!CorsOriginRule.TryCreate(origin, out var rule) || rule is null)
            {
                continue;
            }

            if (rule.AllowsAnyPort)
            {
                wildcardRules.Add(rule);
                continue;
            }

            exactOrigins.Add(rule.NormalizedOrigin);
        }

        return new CorsOriginRuleSet(exactOrigins, wildcardRules);
    }

    private sealed class CorsOriginRuleSet
    {
        private readonly IReadOnlyCollection<CorsOriginRule> _wildcardRules;
        private readonly HashSet<string> _exactOrigins;

        public CorsOriginRuleSet(
            HashSet<string> exactOrigins,
            IReadOnlyCollection<CorsOriginRule> wildcardRules)
        {
            _exactOrigins = exactOrigins;
            _wildcardRules = wildcardRules;
        }

        public IReadOnlyCollection<string> ExactOrigins => _exactOrigins;

        public bool IsAllowed(string origin)
        {
            if (_exactOrigins.Contains(origin))
            {
                return true;
            }

            if (_exactOrigins.Count == 0 && _wildcardRules.Count == 0)
            {
                return false;
            }

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var parsedOrigin))
            {
                return false;
            }

            foreach (var wildcardRule in _wildcardRules)
            {
                if (wildcardRule.Matches(parsedOrigin))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
