using System.ComponentModel.DataAnnotations;

namespace feedme.Server.Models;

public class ReceiptLine
{
    [Required]
    public string CatalogItemId { get; set; } = string.Empty;

    [Required]
    public string Sku { get; set; } = string.Empty;

    [Required]
    public string ItemName { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    [Required]
    public string Unit { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.00", "79228162514264337593543950335", ErrorMessage = "Unit price must be non-negative.")]
    public decimal UnitPrice { get; set; }

    public DateTime? ExpiryDate { get; set; }

    [Required]
    public string Status { get; set; } = ShelfLifeState.Ok.ToCode();

    public decimal TotalCost => UnitPrice * Quantity;
}
