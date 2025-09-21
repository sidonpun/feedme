using System.Net;
using System.Net.Sockets;

namespace feedme.AppHost;

internal static class AspireEndpointPortAllocator
{
    private static readonly string[] EndpointVariableNames =
    [
        "DOTNET_RESOURCE_SERVICE_ENDPOINT_URL",
        "DOTNET_DASHBOARD_OTLP_ENDPOINT_URL"
    ];

    public static void EnsureRequiredPortsAreAvailable()
    {
        foreach (var variableName in EndpointVariableNames)
        {
            EnsureEndpointPortAvailable(variableName);
        }
    }

    internal static void EnsureEndpointPortAvailable(string variableName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(variableName);

        var rawValue = Environment.GetEnvironmentVariable(variableName);

        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return;
        }

        if (!Uri.TryCreate(rawValue, UriKind.Absolute, out var endpointUri))
        {
            return;
        }

        if (!IsSupportedScheme(endpointUri.Scheme) || endpointUri.Port <= 0)
        {
            return;
        }

        var addresses = ResolveAddresses(endpointUri);

        if (addresses.Count == 0)
        {
            return;
        }

        if (IsPortAvailable(addresses, endpointUri.Port))
        {
            return;
        }

        var newPort = FindAvailablePort(addresses);

        if (newPort == endpointUri.Port)
        {
            return;
        }

        var builder = new UriBuilder(endpointUri)
        {
            Port = newPort
        };

        Environment.SetEnvironmentVariable(variableName, builder.Uri.ToString());
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
}
