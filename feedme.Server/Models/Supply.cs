using System.ComponentModel.DataAnnotations;

namespace feedme.Server.Models;

public class Supply
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(32)]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(36)]
    public string CatalogItemId { get; set; } = string.Empty;

    public CatalogItem? CatalogItem { get; set; }

    public decimal Quantity { get; set; }

    public DateTime ArrivalDate { get; set; } = DateTime.UtcNow.Date;

    public DateTime? ExpiryDate { get; set; }

    [Required]
    [MaxLength(128)]
    public string Warehouse { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string Responsible { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Status { get; set; } = ShelfLifeState.Ok.ToCode();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
