using System;
using feedme.Server.Models;

namespace feedme.Server.Services;

public static class ShelfLifeStatusCalculator
{
    private const double WarningThreshold = 0.8;

    public static ShelfLifeState Evaluate(DateTime receivedAt, DateTime expiryDate, DateTime? reference = null)
    {
        var arrival = ToDateOnly(receivedAt);
        var expiry = ToDateOnly(expiryDate);
        var today = ToDateOnly(reference ?? DateTime.UtcNow);

        if (expiry <= today)
        {
            return ShelfLifeState.Expired;
        }

        if (expiry <= arrival)
        {
            return ShelfLifeState.Expired;
        }

        var shelfLifeDays = expiry.DayNumber - arrival.DayNumber;
        if (shelfLifeDays <= 0)
        {
            return ShelfLifeState.Expired;
        }

        var elapsedDays = Math.Clamp(today.DayNumber - arrival.DayNumber, 0, shelfLifeDays);
        var progress = elapsedDays / (double)shelfLifeDays;

        return progress >= WarningThreshold ? ShelfLifeState.Warning : ShelfLifeState.Ok;
    }

    private static DateOnly ToDateOnly(DateTime value)
    {
        var normalized = value.Kind switch
        {
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => value
        };

        return DateOnly.FromDateTime(normalized);
    }

}
