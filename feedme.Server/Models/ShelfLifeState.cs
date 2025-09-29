namespace feedme.Server.Models;

public enum ShelfLifeState
{
    Ok,
    Warning,
    Expired
}

public static class ShelfLifeStateExtensions
{
    public static string ToCode(this ShelfLifeState state) => state switch
    {
        ShelfLifeState.Warning => "warning",
        ShelfLifeState.Expired => "expired",
        _ => "ok"
    };
}
