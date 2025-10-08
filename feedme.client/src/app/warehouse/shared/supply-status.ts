export type SupplyStatus = 'ok' | 'warning' | 'expired';

export const SUPPLY_STATUSES: ReadonlyArray<SupplyStatus> = ['ok', 'warning', 'expired'] as const;

export function isSupplyStatus(value: string): value is SupplyStatus {
  return SUPPLY_STATUSES.includes(value as SupplyStatus);
}
