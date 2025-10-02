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
  category: string;
  supplier?: string;
  purchasePrice: number | null;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  sku: string;
  category: string;
  unit: string;
  unitWeight: number | null;
  writeoff: string;
  allergens: string | null;
  needsPacking: boolean;
  perishableAfterOpen: boolean;
  supplierMain: string | null;
  leadTimeDays: number | null;
  costEst: number | null;
  vat: string | null;
  purchasePrice: number | null;
  salePrice: number | null;
  tnvCode: string | null;
  marked: boolean;
  alcohol: boolean;
  alcoholCode: string | null;
  alcoholStrength: number | null;
  alcoholVolume: number | null;
}
