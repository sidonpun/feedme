using System.ComponentModel.DataAnnotations;
using feedme.Server.Infrastructure.Validation;

namespace feedme.Server.Models;

public static class InventoryDocumentStatuses
{
    public const string Draft = "draft";
    public const string InProgress = "in-progress";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";

    private static readonly HashSet<string> AllowedValues = new(StringComparer.OrdinalIgnoreCase)
    {
        Draft,
        InProgress,
        Completed,
        Cancelled,
    };

    public static string Normalize(string? value)
    {
        if (value is null)
        {
            return Draft;
        }

        var normalized = value.Trim().ToLowerInvariant();
        return AllowedValues.Contains(normalized) ? normalized : Draft;
    }
}

public class InventoryDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(64)]
    public string Number { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string Warehouse { get; set; } = string.Empty;

    [MaxLength(128)]
    public string Responsible { get; set; } = string.Empty;

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    [Required]
    [MaxLength(32)]
    public string Status { get; set; } = InventoryDocumentStatuses.Draft;

    [MinLength(1, ErrorMessage = "An inventory document must contain at least one item.")]
    [EnsureCollectionElementsNotNull(ErrorMessage = "Inventory items cannot contain null values.")]
    public List<InventoryLine> Items { get; set; } = new();

    public decimal TotalExpected => Items.Sum(item => item.ExpectedCost);

    public decimal TotalCounted => Items.Sum(item => item.CountedCost);

    public decimal TotalDifference => Items.Sum(item => item.DifferenceCost);

    public int Positions => Items.Count;
}
