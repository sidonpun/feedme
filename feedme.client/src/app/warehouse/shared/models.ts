export type SupplyStatus = 'ok' | 'warning' | 'expired';

export interface Product {
  id: string;
  name: string;
  type: 'Товар' | 'Заготовка' | 'Полуфабрикат';
  sku: string;
  category: string;
  unit: 'кг' | 'л' | 'шт' | string;
  unitWeight?: number;
  writeoff?: 'FIFO' | 'FEFO' | 'LIFO' | string;
  allergens?: string;
  needsPacking?: boolean;
  perishableAfterOpen?: boolean;
  supplierMain?: string;
  leadTimeDays?: number;
  costEst?: number;
  vat?: string;
  purchasePrice?: number;
  salePrice?: number;
  tnvCode?: string;
  marked?: boolean;
  alcohol?: boolean;
}

export interface SupplyRow {
  id: string;
  docNo: string;
  arrivalDate: string;
  warehouse: string;
  responsible?: string;
  productId: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  expiryDate: string;
  supplier?: string;
  status: SupplyStatus;
}
