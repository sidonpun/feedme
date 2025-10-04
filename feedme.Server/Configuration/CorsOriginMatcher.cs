using System;

namespace feedme.Server.Configuration;

internal sealed class CorsOriginMatcher
{
    private readonly string _original;
    private readonly string _scheme;
    private readonly string _host;
    private readonly int? _port;

    private CorsOriginMatcher(string original, string scheme, string host, int? port)
    {
        _original = original;
        _scheme = scheme;
        _host = host;
        _port = port;
    }

    public static CorsOriginMatcher? TryCreate(string origin)
    {
        if (string.IsNullOrWhiteSpace(origin))
        {
            return null;
        }

        if (!Uri.TryCreate(origin, UriKind.Absolute, out var parsedOrigin))
        {
            return null;
        }

        var normalizedOrigin = parsedOrigin.GetLeftPart(UriPartial.Authority);
        int? port = parsedOrigin.IsDefaultPort ? null : parsedOrigin.Port;

        return new CorsOriginMatcher(normalizedOrigin, parsedOrigin.Scheme, parsedOrigin.Host, port);
    }

    public bool Matches(string? origin)
    {
        if (string.IsNullOrWhiteSpace(origin))
        {
            return false;
        }

        if (string.Equals(origin, _original, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!Uri.TryCreate(origin, UriKind.Absolute, out var candidate))
        {
            return false;
        }

        if (!string.Equals(candidate.Scheme, _scheme, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.Equals(candidate.Host, _host, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (_port.HasValue)
        {
            return candidate.Port == _port.Value;
        }

        return true;
    }
}
