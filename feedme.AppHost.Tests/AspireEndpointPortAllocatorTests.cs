using System.Net;
using System.Net.Sockets;
using feedme.AppHost;
using Xunit;

namespace feedme.AppHost.Tests;

public class AspireEndpointPortAllocatorTests
{
    [Fact]
    public void EnsureEndpointPortAvailable_ChangesPortWhenOriginalPortIsBusy()
    {
        const string variableName = "DOTNET_RESOURCE_SERVICE_ENDPOINT_URL";

        using var occupiedListener = new TcpListener(IPAddress.Loopback, 0);
        occupiedListener.Start();
        var occupiedPort = ((IPEndPoint)occupiedListener.LocalEndpoint).Port;

        var originalUri = new UriBuilder(Uri.UriSchemeHttps, IPAddress.Loopback.ToString(), occupiedPort).Uri.ToString();

        try
        {
            Environment.SetEnvironmentVariable(variableName, originalUri);

            AspireEndpointPortAllocator.EnsureEndpointPortAvailable(variableName);

            var updatedValue = Environment.GetEnvironmentVariable(variableName);
            Assert.NotNull(updatedValue);
            Assert.NotEqual(originalUri, updatedValue);

            var updatedUri = new Uri(updatedValue);
            Assert.NotEqual(occupiedPort, updatedUri.Port);
            Assert.True(IsPortCurrentlyAvailable(updatedUri), "Allocated port is unexpectedly unavailable.");
        }
        finally
        {
            Environment.SetEnvironmentVariable(variableName, null);
        }
    }

    [Fact]
    public void EnsureEndpointPortAvailable_PreservesPortWhenItIsFree()
    {
        const string variableName = "DOTNET_DASHBOARD_OTLP_ENDPOINT_URL";

        var freePort = GetFreePort();
        var originalValue = $"http://127.0.0.1:{freePort}";

        try
        {
            Environment.SetEnvironmentVariable(variableName, originalValue);

            AspireEndpointPortAllocator.EnsureEndpointPortAvailable(variableName);

            var updatedValue = Environment.GetEnvironmentVariable(variableName);
            Assert.Equal(originalValue, updatedValue);
        }
        finally
        {
            Environment.SetEnvironmentVariable(variableName, null);
        }
    }

    [Fact]
    public void EnsureEndpointPortAvailable_AssignsPortWhenVariableIsMissing()
    {
        const string variableName = "DOTNET_RESOURCE_SERVICE_ENDPOINT_URL";

        try
        {
            Environment.SetEnvironmentVariable(variableName, null);

            AspireEndpointPortAllocator.EnsureEndpointPortAvailable(variableName);

            var updatedValue = Environment.GetEnvironmentVariable(variableName);
            Assert.False(string.IsNullOrWhiteSpace(updatedValue));

            var updatedUri = new Uri(updatedValue!);
            Assert.True(updatedUri.Port > 0);
            Assert.True(IsPortCurrentlyAvailable(updatedUri), "Allocated port is unexpectedly unavailable.");
        }
        finally
        {
            Environment.SetEnvironmentVariable(variableName, null);
        }
    }

    private static int GetFreePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static bool IsPortCurrentlyAvailable(Uri uri)
    {
        var address = IPAddress.TryParse(uri.Host, out var parsedAddress)
            ? parsedAddress
            : IPAddress.Loopback;

        TcpListener? listener = null;

        try
        {
            listener = new TcpListener(address, uri.Port);
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
}
