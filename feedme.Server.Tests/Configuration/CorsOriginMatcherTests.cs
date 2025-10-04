using feedme.Server.Configuration;
using Xunit;

namespace feedme.Server.Tests.Configuration;

public class CorsOriginMatcherTests
{
    [Fact]
    public void TryCreate_ReturnsNull_ForInvalidOrigin()
    {
        var matcher = CorsOriginMatcher.TryCreate("not-a-valid-origin");

        Assert.Null(matcher);
    }

    [Fact]
    public void Matches_ReturnsTrue_ForExactOrigin()
    {
        var matcher = CorsOriginMatcher.TryCreate("http://localhost:4200");

        Assert.NotNull(matcher);
        Assert.True(matcher!.Matches("http://localhost:4200"));
        Assert.False(matcher.Matches("http://localhost:4201"));
    }

    [Fact]
    public void Matches_IgnoresPort_WhenOriginDoesNotSpecifyPort()
    {
        var matcher = CorsOriginMatcher.TryCreate("http://localhost");

        Assert.NotNull(matcher);
        Assert.True(matcher!.Matches("http://localhost:4200"));
        Assert.True(matcher.Matches("http://localhost:3000"));
        Assert.False(matcher.Matches("http://example.com:4200"));
    }
}
