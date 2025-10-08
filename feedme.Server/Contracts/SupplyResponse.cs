namespace feedme.Server.Contracts;

public sealed record SupplyResponse(
    string Id,
    string DocumentNumber,
    DateTime ArrivalDate,
    string Warehouse,
    string Responsible,
    string CatalogItemId,
    string ProductName,
    string Sku,
    string Category,
    decimal Quantity,
    string Unit,
    DateTime? ExpiryDate,
    string Supplier,
    string Status,
    decimal UnitPrice,
    DateTime CreatedAt
);
