using System.ComponentModel.DataAnnotations;
using System.Linq;

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

    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    [MinLength(1, ErrorMessage = "A receipt must contain at least one item.")]
    public List<ReceiptLine> Items { get; set; } = new();

    public decimal TotalAmount => Items.Sum(item => item.TotalCost);
}
