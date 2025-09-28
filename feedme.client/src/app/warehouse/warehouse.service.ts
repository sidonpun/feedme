import { Injectable, signal } from '@angular/core';

import { SupplyRow } from './models';

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
      status: 'ok',
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
  ]);

  readonly list = () => this.rowsSignal.asReadonly();

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
}
