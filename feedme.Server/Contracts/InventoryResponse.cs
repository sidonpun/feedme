namespace feedme.Server.Contracts;

public record InventoryResponse(
    string Id,
    string Number,
    string Warehouse,
    string Responsible,
    DateTime StartedAt,
    DateTime? CompletedAt,
    string Status,
    decimal TotalExpected,
    decimal TotalCounted,
    decimal TotalDifference,
    int Positions,
    IReadOnlyCollection<InventoryLineResponse> Items);
