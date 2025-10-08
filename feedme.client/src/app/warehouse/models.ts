export type SupplyStatus = 'ok' | 'warning' | 'expired';

export const SUPPLY_STATUSES: ReadonlyArray<SupplyStatus> = [
  'ok',
  'warning',
  'expired',
];

export function isSupplyStatus(value: string): value is SupplyStatus {
  return SUPPLY_STATUSES.includes(value as SupplyStatus);
}

export interface SupplyRow {
  readonly id: string;
  readonly productId: string;
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
