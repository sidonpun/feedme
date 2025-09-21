using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;

namespace feedme.AppHost;

internal static class AspireEndpointPortAllocator
{
    private static readonly IReadOnlyDictionary<string, EndpointDefinition> EndpointDefinitions =
        new Dictionary<string, EndpointDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["DOTNET_RESOURCE_SERVICE_ENDPOINT_URL"] = new EndpointDefinition(Uri.UriSchemeHttps, "localhost"),
            ["DOTNET_DASHBOARD_OTLP_ENDPOINT_URL"] = new EndpointDefinition(Uri.UriSchemeHttps, "localhost")
        };

    public static void EnsureRequiredPortsAreAvailable()
    {
        foreach (var variableName in EndpointDefinitions.Keys)
        {
            EnsureEndpointPortAvailable(variableName);
        }
    }

    internal static void EnsureEndpointPortAvailable(string variableName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(variableName);

        var definition = EndpointDefinitions.GetValueOrDefault(variableName);
        var context = TryCreateContextFromEnvironment(variableName, definition);

        if (context is null || context.Addresses.Count == 0)
        {
            return;
        }

        var requiresUpdate = context.RequiresUpdate;
        var port = context.Uri.Port;

        if (port <= 0)
        {
            requiresUpdate = true;
        }
        else if (!requiresUpdate && !IsPortAvailable(context.Addresses, port))
        {
            requiresUpdate = true;
        }

        if (!requiresUpdate)
        {
            return;
        }

        var newPort = FindAvailablePort(context.Addresses);

        if (!context.RequiresUpdate && newPort == port)
        {
            return;
        }

        var builder = new UriBuilder(context.Uri)
        {
            Port = newPort
        };

        Environment.SetEnvironmentVariable(variableName, builder.Uri.ToString());
    }

    private static EndpointContext? TryCreateContextFromEnvironment(string variableName, EndpointDefinition? definition)
    {
        var rawValue = Environment.GetEnvironmentVariable(variableName);

        if (!string.IsNullOrWhiteSpace(rawValue) && Uri.TryCreate(rawValue, UriKind.Absolute, out var endpointUri))
        {
            var addresses = ResolveAddresses(endpointUri);
            var hasSupportedScheme = IsSupportedScheme(endpointUri.Scheme);
            var hasValidPort = endpointUri.Port > 0;

            if (addresses.Count > 0 && hasSupportedScheme && hasValidPort)
            {
                return new EndpointContext(endpointUri, addresses, RequiresUpdate: false);
            }

            if (definition is null)
            {
                return null;
            }

            var fallbackAddresses = addresses.Count > 0 ? addresses : definition.Addresses;
            var fallbackUri = hasSupportedScheme && addresses.Count > 0
                ? endpointUri
                : definition.CreateFallbackUri();

            return new EndpointContext(fallbackUri, fallbackAddresses, RequiresUpdate: true);
        }

        if (definition is null)
        {
            return null;
        }

        return new EndpointContext(definition.CreateFallbackUri(), definition.Addresses, RequiresUpdate: true);
    }

    private static bool IsSupportedScheme(string scheme)
    {
        return string.Equals(scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
               || string.Equals(scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<IPAddress> ResolveAddresses(Uri endpointUri)
    {
        if (string.Equals(endpointUri.Host, "localhost", StringComparison.OrdinalIgnoreCase))
        {
            return new[] { IPAddress.Loopback, IPAddress.IPv6Loopback };
        }

        if (IPAddress.TryParse(endpointUri.Host, out var ipAddress))
        {
            return new[] { ipAddress };
        }

        return Array.Empty<IPAddress>();
    }

    private static bool IsPortAvailable(IEnumerable<IPAddress> addresses, int port)
    {
        foreach (var address in addresses)
        {
            if (!IsPortAvailable(address, port))
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsPortAvailable(IPAddress address, int port)
    {
        TcpListener? listener = null;

        try
        {
            listener = new TcpListener(address, port);
            listener.Start();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
        finally
        {
            listener?.Stop();
        }
    }

    private static int FindAvailablePort(IReadOnlyList<IPAddress> addresses)
    {
        if (addresses.Count == 0)
        {
            throw new ArgumentException("At least one address is required to allocate a port.", nameof(addresses));
        }

        if (addresses.Count > 1 && ContainsLoopbackPair(addresses))
        {
            return ReserveDualModeLoopbackPort();
        }

        return ReservePort(addresses[0]);
    }

    private static bool ContainsLoopbackPair(IReadOnlyList<IPAddress> addresses)
    {
        var containsIpv4 = false;
        var containsIpv6 = false;

        foreach (var address in addresses)
        {
            containsIpv4 |= address.Equals(IPAddress.Loopback);
            containsIpv6 |= address.Equals(IPAddress.IPv6Loopback);
        }

        return containsIpv4 && containsIpv6;
    }

    private static int ReserveDualModeLoopbackPort()
    {
        using var socket = new Socket(AddressFamily.InterNetworkV6, SocketType.Stream, ProtocolType.Tcp)
        {
            DualMode = true
        };

        socket.Bind(new IPEndPoint(IPAddress.IPv6Loopback, 0));
        return ((IPEndPoint)socket.LocalEndPoint!).Port;
    }

    private static int ReservePort(IPAddress address)
    {
        TcpListener? listener = null;

        try
        {
            listener = new TcpListener(address, 0);
            listener.Start();
            return ((IPEndPoint)listener.LocalEndpoint).Port;
        }
        finally
        {
            listener?.Stop();
        }
    }

    private sealed record EndpointContext(Uri Uri, IReadOnlyList<IPAddress> Addresses, bool RequiresUpdate);

    private sealed class EndpointDefinition
    {
        private readonly string _scheme;
        private readonly string _host;
        private IReadOnlyList<IPAddress>? _addresses;

        public EndpointDefinition(string scheme, string host)
        {
            _scheme = scheme;
            _host = host;
        }

        public IReadOnlyList<IPAddress> Addresses => _addresses ??= ResolveAddresses(CreateFallbackUri());

        public Uri CreateFallbackUri()
        {
            return new UriBuilder(_scheme, _host)
            {
                Port = 0
            }.Uri;
        }
    }
}
