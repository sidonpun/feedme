using System;
using System.Collections.Generic;

namespace feedme.Server.Models;

public class CatalogItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public double Weight { get; set; }
    public string WriteoffMethod { get; set; } = string.Empty;
    public string Allergens { get; set; } = string.Empty;
    public bool PackagingRequired { get; set; }
    public bool SpoilsAfterOpening { get; set; }
    public string Supplier { get; set; } = string.Empty;
    public int DeliveryTime { get; set; }
    public double CostEstimate { get; set; }
    public string TaxRate { get; set; } = string.Empty;
    public double UnitPrice { get; set; }
    public double SalePrice { get; set; }
    public string Tnved { get; set; } = string.Empty;
    public bool IsMarked { get; set; }
    public bool IsAlcohol { get; set; }
    public string AlcoholCode { get; set; } = string.Empty;
    public double AlcoholStrength { get; set; }
    public double AlcoholVolume { get; set; }
    public ICollection<ProductFlag> Flags { get; set; } = new List<ProductFlag>();
}
