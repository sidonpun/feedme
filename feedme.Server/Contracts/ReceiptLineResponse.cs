using System;

namespace feedme.Server.Contracts;

public sealed record ReceiptLineResponse(
    string CatalogItemId,
    string ItemName,
    decimal Quantity,
    string Unit,
    decimal UnitPrice,
    decimal TotalCost,
    DateTime? ExpiryDate,
    string Status
);
