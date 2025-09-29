using System;
using System.Collections.Generic;

namespace feedme.Server.Contracts;

public sealed record ReceiptResponse(
    string Id,
    string Number,
    string Supplier,
    string Warehouse,
    DateTime ReceivedAt,
    IReadOnlyList<ReceiptLineResponse> Items,
    decimal TotalAmount
);
