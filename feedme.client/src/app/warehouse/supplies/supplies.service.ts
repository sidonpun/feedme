import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';


import { SupplyProduct, SupplyRow } from '../shared/models';
import { computeExpiryStatus } from '../shared/status.util';

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private readonly productList: SupplyProduct[] = [
    { id: 'prod-chicken', sku: 'MEAT-001', name: 'Курица охлаждённая', unit: 'кг', supplier: 'ООО Куры Дуры' },
    { id: 'prod-beef', sku: 'MEAT-002', name: 'Говядина вырезка', unit: 'кг', supplier: 'Ферма №5' },
    { id: 'prod-cream', sku: 'DAIRY-004', name: 'Сливки 33%', unit: 'л', supplier: 'МолКомбинат' },
    { id: 'prod-apples', sku: 'VEG-011', name: 'Яблоко зеленое', unit: 'кг', supplier: 'ОвощБаза' },
    { id: 'prod-juice', sku: 'BEV-021', name: 'Сок яблочный', unit: 'л', supplier: 'Fresh Drinks' },
  ];

  private readonly productMap = new Map(this.productList.map((product) => [product.id, product]));
  private readonly productsSubject = new BehaviorSubject<SupplyProduct[]>(this.productList);

  private readonly rowsSubject = new BehaviorSubject<SupplyRow[]>(this.createInitialRows());

  private idCounter = this.rowsSubject.value.length;

  getAll(): Observable<SupplyRow[]> {
    return this.rowsSubject.asObservable();
  }

  getProducts(): Observable<SupplyProduct[]> {
    return this.productsSubject.asObservable();
  }

  getProductById(productId: string): SupplyProduct | undefined {
    return this.productMap.get(productId);
  }

  add(row: SupplyRow): Observable<SupplyRow>;
  add(row: Omit<SupplyRow, 'id'>): Observable<SupplyRow>;
  add(row: SupplyRow | Omit<SupplyRow, 'id'>): Observable<SupplyRow> {
    const payload = { ...row } as SupplyRow;
    const nextRow: SupplyRow = {
      ...payload,
      id: this.generateId(),
    };

    this.rowsSubject.next([nextRow, ...this.rowsSubject.value]);
    return of(nextRow);
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    this.idCounter += 1;
    return `supply-${this.idCounter}`;
  }

  private createInitialRows(): SupplyRow[] {
    const today = new Date();
    const arrivalFirst = this.formatISO(today);
    const expiryFirst = this.formatISO(this.addDays(today, 30));

    const arrivalSecond = this.formatISO(this.addDays(today, -2));
    const expirySecond = this.formatISO(this.addDays(today, 7));

    const arrivalThird = this.formatISO(this.addDays(today, -5));
    const expiryThird = this.formatISO(this.addDays(today, -1));

    return [
      {
        id: 'supply-1',
        docNo: 'PO-000851',
        arrivalDate: arrivalFirst,
        warehouse: 'Главный склад',
        responsible: 'Иванов И.',
        productId: 'prod-chicken',
        sku: 'MEAT-001',
        name: 'Курица охлаждённая',
        qty: 120,
        unit: 'кг',
        expiryDate: expiryFirst,
        supplier: 'ООО Куры Дуры',
        status: computeExpiryStatus(expiryFirst),
      },
      {
        id: 'supply-2',
        docNo: 'PO-000852',
        arrivalDate: arrivalSecond,
        warehouse: 'Кухня',
        responsible: 'Петров П.',
        productId: 'prod-beef',
        sku: 'MEAT-002',
        name: 'Говядина вырезка',
        qty: 16,
        unit: 'кг',
        expiryDate: expirySecond,
        supplier: 'Ферма №5',
        status: computeExpiryStatus(expirySecond),
      },
      {
        id: 'supply-3',
        docNo: 'PO-000853',
        arrivalDate: arrivalThird,
        warehouse: 'Бар',
        responsible: 'Сидоров С.',
        productId: 'prod-cream',
        sku: 'DAIRY-004',
        name: 'Сливки 33%',
        qty: 12,
        unit: 'л',
        expiryDate: expiryThird,
        supplier: 'МолКомбинат',
        status: computeExpiryStatus(expiryThird),
      },
    ];
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;

  }
}
