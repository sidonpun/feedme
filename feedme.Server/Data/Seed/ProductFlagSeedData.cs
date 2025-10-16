using feedme.Server.Models;

namespace feedme.Server.Data.Seed;

internal static class ProductFlagSeedData
{
    public static IReadOnlyList<ProductFlag> Flags { get; } = new[]
    {
        new ProductFlag
        {
            Code = ProductFlagCodes.Pack,
            Name = "Требует фасовки",
            IsActive = true,
        },
        new ProductFlag
        {
            Code = ProductFlagCodes.SpoilOpen,
            Name = "Портится после вскрытия",
            IsActive = true,
        },
        new ProductFlag
        {
            Code = ProductFlagCodes.Fragile,
            Name = "Хрупкий товар",
            IsActive = true,
        },
        new ProductFlag
        {
            Code = ProductFlagCodes.Temp,
            Name = "Требует температурный режим",
            IsActive = true,
        },
    };
}
