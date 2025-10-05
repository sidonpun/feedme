using System;

namespace feedme.Server.Configuration;

public sealed class FileLoggingOptions
{
    public const string SectionName = "Logging:File";

    public string Directory { get; init; } = "Logs";

    public string FileName { get; init; } = "feedme";

    public string RollingInterval { get; init; } = "Day";

    public int? RetainedFileCountLimit { get; init; } = 14;

    public long FileSizeLimitBytes { get; init; } = 20 * 1_024 * 1_024;

    public TimeSpan FlushInterval { get; init; } = TimeSpan.FromSeconds(1);
}
