using System.Collections.Immutable;
using System.Collections.Generic;
using System.Linq;

namespace feedme.Server.Configuration;

public sealed class CorsSettings
{
    public const string SectionName = "Cors";
    public const string PolicyName = "ConfiguredOrigins";

    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();

    public IReadOnlyCollection<string> GetSanitizedOrigins()
    {
        if (AllowedOrigins.Length == 0)
        {
            return Array.Empty<string>();
        }

        var sanitizedOrigins = AllowedOrigins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim().TrimEnd('/'))
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToImmutableArray();

        return sanitizedOrigins;
    }
}
