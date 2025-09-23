using feedme.Server.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace feedme.Server.Tests.Extensions;

public class DatabaseMigrationRetryPolicyTests
{
    private static readonly ILogger Logger = NullLogger.Instance;

    [Fact]
    public async Task ExecuteAsync_SucceedsWithoutRetry_WhenOperationSucceeds()
    {
        var attempts = 0;
        var delayInvocations = 0;

        await DatabaseMigrationRetryPolicy.ExecuteAsync(
            _ =>
            {
                attempts++;
                return Task.CompletedTask;
            },
            Logger,
            (_, _) =>
            {
                delayInvocations++;
                return Task.CompletedTask;
            },
            CancellationToken.None);

        Assert.Equal(1, attempts);
        Assert.Equal(0, delayInvocations);
    }

    [Fact]
    public async Task ExecuteAsync_RetriesUntilSuccess_WhenTransientErrorsOccur()
    {
        var attempts = 0;
        var delayInvocations = 0;
        const int failuresBeforeSuccess = 2;

        await DatabaseMigrationRetryPolicy.ExecuteAsync(
            _ =>
            {
                if (attempts++ < failuresBeforeSuccess)
                {
                    throw new TimeoutException("Simulated transient failure.");
                }

                return Task.CompletedTask;
            },
            Logger,
            (_, _) =>
            {
                delayInvocations++;
                return Task.CompletedTask;
            },
            CancellationToken.None);

        Assert.Equal(failuresBeforeSuccess + 1, attempts);
        Assert.Equal(failuresBeforeSuccess, delayInvocations);
    }

    [Fact]
    public async Task ExecuteAsync_ThrowsAfterMaxAttempts_WhenFailuresPersist()
    {
        var attempts = 0;
        var delayInvocations = 0;

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DatabaseMigrationRetryPolicy.ExecuteAsync(
                _ =>
                {
                    attempts++;
                    throw new TimeoutException("Persistent transient failure.");
                },
                Logger,
                (_, _) =>
                {
                    delayInvocations++;
                    return Task.CompletedTask;
                },
                CancellationToken.None));

        Assert.IsType<TimeoutException>(exception.InnerException);
        Assert.Equal(DatabaseMigrationRetryPolicy.MaxRetryAttempts, attempts);
        Assert.Equal(DatabaseMigrationRetryPolicy.MaxRetryAttempts - 1, delayInvocations);
    }

    [Fact]
    public async Task ExecuteAsync_DoesNotRetry_WhenExceptionIsNotTransient()
    {
        var attempts = 0;

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DatabaseMigrationRetryPolicy.ExecuteAsync(
                _ =>
                {
                    attempts++;
                    throw new InvalidOperationException("Non-transient failure.");
                },
                Logger,
                (_, _) => Task.CompletedTask,
                CancellationToken.None));

        Assert.Equal(1, attempts);
    }
}
