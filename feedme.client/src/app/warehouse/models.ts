import { SUPPLY_STATUSES, SupplyStatus, isSupplyStatus } from './shared/supply-status';

export { SUPPLY_STATUSES, isSupplyStatus };
export type { SupplyStatus };

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
