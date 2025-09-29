export type SupplyStatus = 'ok' | 'warning' | 'expired';


export interface SupplyRow {
  id: string;
  docNo: string;
  arrivalDate: string; // YYYY-MM-DD

  warehouse: string;
  responsible?: string;
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;

  expiryDate: string; // YYYY-MM-DD
  supplier?: string;
  status: SupplyStatus;
}

export interface SupplyProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  supplier?: string;
}

