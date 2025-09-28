import { Injectable, signal } from '@angular/core';

import { SupplyRow } from './models';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly rowsSignal = signal<SupplyRow[]>([
    {
      id: 1,
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
}
