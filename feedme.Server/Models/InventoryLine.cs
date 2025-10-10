using System.ComponentModel.DataAnnotations;
using feedme.Server.Infrastructure.Validation;

namespace feedme.Server.Models;

public class InventoryLine
{
    [Required]
    [MaxLength(64)]
    public string CatalogItemId { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string ItemName { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string Category { get; set; } = string.Empty;

    [InvariantDecimalRange("0.00", "79228162514264337593543950335", ErrorMessage = "Expected quantity must be non-negative.")]
    public decimal ExpectedQuantity { get; set; }

    [InvariantDecimalRange("0.00", "79228162514264337593543950335", ErrorMessage = "Counted quantity must be non-negative.")]
    public decimal CountedQuantity { get; set; }

    [Required]
    [MaxLength(32)]
    public string Unit { get; set; } = string.Empty;

    [InvariantDecimalRange("0.00", "79228162514264337593543950335", ErrorMessage = "Unit price must be non-negative.")]
    public decimal UnitPrice { get; set; }

    public decimal DifferenceQuantity => CountedQuantity - ExpectedQuantity;

    public decimal ExpectedCost => UnitPrice * ExpectedQuantity;

    public decimal CountedCost => UnitPrice * CountedQuantity;

    public decimal DifferenceCost => UnitPrice * DifferenceQuantity;
}
