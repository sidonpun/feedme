using System;
using feedme.Server.Configuration;
using Xunit;

namespace feedme.Server.Tests.Configuration;

public class CorsOriginRuleTests
{
    [Fact]
    public void TryCreate_WithWildcardPort_AllowsAnyPort()
    {
        var created = CorsOriginRule.TryCreate("http://example.com:*", out var rule);

        Assert.True(created);
        Assert.NotNull(rule);
        Assert.True(rule!.AllowsAnyPort);
        Assert.Equal("http://example.com", rule.NormalizedOrigin);
        Assert.True(rule.Matches(new Uri("http://example.com:8080")));
        Assert.True(rule.Matches(new Uri("http://example.com:5000")));
    }

    [Fact]
    public void TryCreate_WithExplicitPort_MatchesOnlyThatPort()
    {
        var created = CorsOriginRule.TryCreate("http://localhost:4200", out var rule);

        Assert.True(created);
        Assert.NotNull(rule);
        Assert.False(rule!.AllowsAnyPort);
        Assert.Equal("http://localhost:4200", rule.NormalizedOrigin);
        Assert.True(rule.Matches(new Uri("http://localhost:4200")));
        Assert.False(rule.Matches(new Uri("http://localhost:4300")));
    }
}
