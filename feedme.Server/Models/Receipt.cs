using System.ComponentModel.DataAnnotations;
using System.Linq;
using feedme.Server.Infrastructure.Validation;

namespace feedme.Server.Models;

public class Receipt
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [MaxLength(64)]
    public string Number { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string Supplier { get; set; } = string.Empty;

    [MaxLength(128)]
    public string Warehouse { get; set; } = string.Empty;

    [MaxLength(128)]
    public string Responsible { get; set; } = string.Empty;

    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    [MinLength(1, ErrorMessage = "A receipt must contain at least one item.")]
    [EnsureCollectionElementsNotNull(ErrorMessage = "Receipt items cannot contain null values.")]
    public List<ReceiptLine> Items { get; set; } = new();

    public decimal TotalAmount => ((IEnumerable<ReceiptLine>?)Items ?? Array.Empty<ReceiptLine>())
        .Where(item => item is not null)
        .Sum(item => item!.TotalCost);
}
