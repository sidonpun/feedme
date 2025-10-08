using System.ComponentModel.DataAnnotations;

namespace feedme.Server.Contracts;

public sealed class CreateSupplyRequest
{
    [Required]
    [MaxLength(36)]
    public string CatalogItemId { get; init; } = string.Empty;

    [MaxLength(32)]
    public string? DocumentNumber { get; init; }

    [Range(0.0001, double.MaxValue)]
    public decimal Quantity { get; init; }

    [Required]
    public DateTime ArrivalDate { get; init; }

    public DateTime? ExpiryDate { get; init; }

    [MaxLength(128)]
    public string? Warehouse { get; init; }

    [MaxLength(128)]
    public string? Responsible { get; init; }
}
