using System.Data.Common;
using System.IO;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;

namespace feedme.Server.Infrastructure;

internal static class DatabaseMigrationRetryPolicy
{
    internal const int MaxRetryAttempts = 5;
    private static readonly TimeSpan InitialDelay = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan MaxDelay = TimeSpan.FromSeconds(30);

    public static Task ExecuteAsync(
        Func<CancellationToken, Task> operation,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(logger);

        return ExecuteAsync(operation, logger, TaskDelayAsync, cancellationToken);
    }

    internal static async Task ExecuteAsync(
        Func<CancellationToken, Task> operation,
        ILogger logger,
        Func<TimeSpan, CancellationToken, Task> delayStrategy,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(operation);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(delayStrategy);

        var delay = InitialDelay;
        Exception? lastException = null;

        for (var attempt = 1; attempt <= MaxRetryAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                await operation(cancellationToken).ConfigureAwait(false);

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation(
                        "Database migration completed on attempt {Attempt}/{MaxAttempts}.",
                        attempt,
                        MaxRetryAttempts);
                }

                return;
            }
            catch (Exception ex) when (IsTransient(ex))
            {
                lastException = ex;

                if (attempt == MaxRetryAttempts)
                {
                    break;
                }

                logger.LogWarning(
                    ex,
                    "Transient failure while applying database migrations (attempt {Attempt}/{MaxAttempts}). Retrying in {DelaySeconds} seconds...",
                    attempt,
                    MaxRetryAttempts,
                    delay.TotalSeconds);

                await delayStrategy(delay, cancellationToken).ConfigureAwait(false);

                var nextDelaySeconds = Math.Min(delay.TotalSeconds * 2, MaxDelay.TotalSeconds);
                delay = TimeSpan.FromSeconds(nextDelaySeconds);
            }
        }

        logger.LogError(
            lastException,
            "Unable to apply database migrations after {MaxAttempts} attempts.",
            MaxRetryAttempts);

        throw new InvalidOperationException(
            $"Unable to apply database migrations after {MaxRetryAttempts} attempts. See inner exception for details.",
            lastException ?? new InvalidOperationException("Unknown database migration failure."));
    }

    private static Task TaskDelayAsync(TimeSpan delay, CancellationToken cancellationToken)
        => Task.Delay(delay, cancellationToken);

    private static bool IsTransient(Exception? exception)
    {
        if (exception is null)
        {
            return false;
        }

        return exception switch
        {
            TimeoutException => true,
            DbException => true,
            IOException => true,
            SocketException => true,
            _ when exception.InnerException is not null => IsTransient(exception.InnerException),
            _ => false
        };
    }
}
