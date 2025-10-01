using System;

namespace feedme.Server.Contracts;

public sealed record ReceiptLineResponse(
    string CatalogItemId,
    string Sku,
    string ItemName,
    string Category,
    decimal Quantity,
    string Unit,
    decimal UnitPrice,
    decimal TotalCost,
    DateTime? ExpiryDate,
    string Status
);
