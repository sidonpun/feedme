export type StockStatus = 'ok' | 'warning' | 'danger';

export interface SupplyRow {
  readonly id: number;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly qty: number;
  readonly unit: string;
  readonly price: number;
  readonly expiry: string;
  readonly supplier: string;
  readonly status: StockStatus;
}
