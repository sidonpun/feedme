using System;

namespace feedme.Server.Configuration;

public sealed class CorsOriginRule
{
    private CorsOriginRule(
        string originalValue,
        string scheme,
        string host,
        int? port,
        bool allowsAnyPort)
    {
        OriginalValue = originalValue;
        Scheme = scheme;
        Host = host;
        Port = port;
        AllowsAnyPort = allowsAnyPort;
        NormalizedOrigin = CreateNormalizedOrigin(scheme, host, port);
    }

    public string OriginalValue { get; }

    public string Scheme { get; }

    public string Host { get; }

    public int? Port { get; }

    public bool AllowsAnyPort { get; }

    public string NormalizedOrigin { get; }

    public static bool TryCreate(string value, out CorsOriginRule? rule)
    {
        rule = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var originValue = value.Trim();
        var allowsAnyPort = originValue.EndsWith(":*", StringComparison.Ordinal);
        var valueWithoutWildcard = allowsAnyPort
            ? originValue[..^2]
            : originValue;

        if (!Uri.TryCreate(valueWithoutWildcard, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.IsNullOrEmpty(uri.PathAndQuery) && uri.PathAndQuery != "/")
        {
            return false;
        }

        var port = uri.IsDefaultPort ? null : uri.Port;

        rule = new CorsOriginRule(originValue, uri.Scheme, uri.Host, port, allowsAnyPort);
        return true;
    }

    public bool Matches(Uri origin)
    {
        if (!string.Equals(origin.Scheme, Scheme, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.Equals(origin.Host, Host, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (AllowsAnyPort)
        {
            return true;
        }

        if (Port is null)
        {
            return origin.IsDefaultPort;
        }

        return origin.Port == Port.Value;
    }

    private static string CreateNormalizedOrigin(string scheme, string host, int? port)
    {
        if (port is null)
        {
            return $"{scheme}://{host}";
        }

        return $"{scheme}://{host}:{port.Value}";
    }
}
