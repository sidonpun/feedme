namespace feedme.Server.Contracts;

public record InventoryLineResponse(
    string CatalogItemId,
    string Sku,
    string ItemName,
    string Category,
    decimal ExpectedQuantity,
    decimal CountedQuantity,
    decimal DifferenceQuantity,
    string Unit,
    decimal UnitPrice,
    decimal ExpectedCost,
    decimal CountedCost,
    decimal DifferenceCost);
