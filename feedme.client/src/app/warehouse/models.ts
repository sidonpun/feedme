export type SupplyStatus = 'ok' | 'warning' | 'danger';

export interface SupplyRow {
  readonly id: number;
  readonly docNo: string;
  readonly arrivalDate: string;
  readonly warehouse: string;
  readonly responsible: string;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly qty: number;
  readonly unit: string;
  readonly price: number;
  readonly expiry: string;
  readonly supplier: string;
  readonly status: SupplyStatus;
}
