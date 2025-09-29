using System.ComponentModel.DataAnnotations;

namespace feedme.Server.Models;

public class ReceiptLine
{
    [Required]
    [MaxLength(64)]
    public string CatalogItemId { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string ItemName { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "Quantity must be greater than zero.")]
    public decimal Quantity { get; set; }

    [Required]
    [MaxLength(32)]
    public string Unit { get; set; } = string.Empty;

    [Range(typeof(decimal), "0.00", "79228162514264337593543950335", ErrorMessage = "Unit price must be non-negative.")]
    public decimal UnitPrice { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public decimal TotalCost => UnitPrice * Quantity;
}
