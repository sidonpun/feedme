import { computed, Injectable, signal } from '@angular/core';

import { SupplyRow } from './models';

export type WarehouseMetrics = {
  suppliesLastWeek: number;
  purchaseAmountLastWeek: number;
  positions: number;
  expired: number;
};

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly rowsSignal = signal<SupplyRow[]>([
    {
      id: 1,
      docNo: 'PO-000851',
      arrivalDate: '2025-09-25',
      warehouse: 'Главный склад',
      responsible: 'Иванов И.',
      sku: 'MEAT-001',
      name: 'Курица охлажд.',
      category: 'Мясные заготовки',
      qty: 120,
      unit: 'кг',
      price: 220,
      expiry: '2025-10-03',
      supplier: 'ООО Куры Дуры',
      status: 'ok',
    },
    {
      id: 2,
      docNo: 'PO-000852',
      arrivalDate: '2025-09-27',
      warehouse: 'Кухня',
      responsible: 'Петров П.',
      sku: 'MEAT-002',
      name: 'Говядина',
      category: 'Мясные заготовки',
      qty: 11,
      unit: 'кг',
      price: 450,
      expiry: '2025-09-28',
      supplier: 'Ферма №5',
      status: 'warning',
    },
    {
      id: 3,
      docNo: 'PO-000853',
      arrivalDate: '2025-09-26',
      warehouse: 'Главный склад',
      responsible: 'Иванов И.',
      sku: 'VEG-011',
      name: 'Лук репчатый',
      category: 'Овощи',
      qty: 35,
      unit: 'кг',
      price: 28,
      expiry: '2025-10-15',
      supplier: 'ОвощБаза',
      status: 'draft',
    },
    {
      id: 4,
      docNo: 'PO-000854',
      arrivalDate: '2025-09-20',
      warehouse: 'Бар',
      responsible: 'Сидоров С.',
      sku: 'DAIRY-004',
      name: 'Сливки 33%',
      category: 'Молочные',
      qty: 12,
      unit: 'л',
      price: 155,
      expiry: '2025-10-01',
      supplier: 'МолКомбинат',
      status: 'danger',
    },
    {
      id: 5,
      docNo: 'PO-000855',
      arrivalDate: '2025-09-29',
      warehouse: 'Главный склад',
      responsible: 'Кириллов К.',
      sku: 'BEV-021',
      name: 'Сок яблочный',
      category: 'Напитки',
      qty: 48,
      unit: 'л',
      price: 75,
      expiry: '2025-10-20',
      supplier: 'Fresh Drinks',
      status: 'transit',
    },
  ]);

  readonly list = () => this.rowsSignal.asReadonly();

  private readonly metricsSignal = computed<WarehouseMetrics>(() =>
    this.computeMetrics(this.rowsSignal()),
  );

  readonly metrics = () => this.metricsSignal;

  metricsForWarehouse(warehouse: string | null): WarehouseMetrics {
    const rows = this.rowsSignal();
    if (!warehouse) {
      return this.computeMetrics(rows);
    }

    return this.computeMetrics(rows.filter((row) => row.warehouse === warehouse));
  }

  addRow(row: Omit<SupplyRow, 'id'>): void {
    this.rowsSignal.update((rows) => {
      const nextId = rows.reduce((max, current) => Math.max(max, current.id), 0) + 1;
      return [...rows, { id: nextId, ...row }];
    });
  }

  updateRow(updatedRow: SupplyRow): void {
    this.rowsSignal.update((rows) =>
      rows.map((row) => (row.id === updatedRow.id ? { ...updatedRow } : row)),
    );
  }

  removeRowsById(ids: readonly number[]): void {
    const idSet = new Set(ids);
    this.rowsSignal.update((rows) => rows.filter((row) => !idSet.has(row.id)));
  }

  private computeMetrics(rows: readonly SupplyRow[]): WarehouseMetrics {
    const skuSet = new Set<string>();

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(startOfToday.getDate() - 6);

    let suppliesLastWeek = 0;
    let purchaseAmountLastWeek = 0;
    let expired = 0;

    for (const row of rows) {
      skuSet.add(row.sku);

      const arrivalDate = this.parseDate(row.arrivalDate);
      if (!Number.isNaN(arrivalDate.getTime()) && arrivalDate >= sevenDaysAgo) {
        suppliesLastWeek += 1;
        purchaseAmountLastWeek += row.qty * row.price;
      }

      const expiryDate = this.parseDate(row.expiry);
      if (!Number.isNaN(expiryDate.getTime()) && expiryDate < startOfToday) {
        expired += 1;
      }
    }

    return {
      suppliesLastWeek,
      purchaseAmountLastWeek,
      positions: skuSet.size,
      expired,
    } satisfies WarehouseMetrics;
  }

  private parseDate(value: string): Date {
    if (!value) {
      return new Date(NaN);
    }

    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}
