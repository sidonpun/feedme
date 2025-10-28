using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace feedme.Server.Models;

public class ProductFlag
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<CatalogItem> CatalogItems { get; set; } = new List<CatalogItem>();
}
