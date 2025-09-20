export interface ReceiptLine {
  catalogItemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost?: number;
}

export interface Receipt {
  id?: string;
  number: string;
  supplier: string;
  warehouse: string;
  receivedAt: string;
  items: ReceiptLine[];
  totalAmount?: number;
}
