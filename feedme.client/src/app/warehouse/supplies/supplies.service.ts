import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';

import { Product, SupplyProduct, SupplyRow } from '../shared/models';
import { computeExpiryStatus } from '../shared/status.util';
import { WarehouseCatalogService } from '../catalog/catalog.service';

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private readonly catalogService = inject(WarehouseCatalogService);

  private readonly productsSubject = new BehaviorSubject<SupplyProduct[]>([]);
  private readonly rowsSubject = new BehaviorSubject<SupplyRow[]>([]);
  private productMap = new Map<string, SupplyProduct>();
  private rowsInitialized = false;
  private idCounter = 0;

  constructor() {
    this.catalogService.getAll().subscribe(products => {
      const mapped = products.map(product => this.toSupplyProduct(product));
      this.productMap = new Map(mapped.map(product => [product.id, product]));
      this.productsSubject.next(mapped);

      if (!this.rowsInitialized) {
        const initialRows = this.createInitialRows(mapped);
        this.rowsSubject.next(initialRows);
        this.idCounter = initialRows.length;
        this.rowsInitialized = true;
      }
    });

    this.catalogService
      .refresh()
      .pipe(take(1))
      .subscribe({
        error: () => {
          this.productsSubject.next([]);
        },
      });
  }

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
    const record: SupplyRow = {
      ...payload,
      id: typeof payload.id === 'string' && payload.id ? payload.id : this.generateId(),
      status: computeExpiryStatus(payload.expiryDate, payload.arrivalDate),
    };

    this.rowsSubject.next([record, ...this.rowsSubject.value]);
    return of(record);
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    this.idCounter += 1;
    return `supply-${this.idCounter}`;
  }

  private createInitialRows(products: SupplyProduct[]): SupplyRow[] {
    if (products.length === 0) {
      return [];
    }

    const today = new Date();

    const formatISO = (source: Date): string => {
      const year = source.getFullYear();
      const month = String(source.getMonth() + 1).padStart(2, '0');
      const day = String(source.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const addDays = (source: Date, offset: number): Date => {
      const result = new Date(source);
      result.setDate(result.getDate() + offset);
      return result;
    };

    const bySku = new Map(products.map(product => [product.sku, product]));

    const buildRow = (
      sku: string,
      docNo: string,
      arrivalOffset: number,
      expiryOffset: number,
      quantity: number,
      warehouse: string,
      responsible: string
    ): SupplyRow | null => {
      const product = bySku.get(sku);
      if (!product) {
        return null;
      }

      const arrivalDate = formatISO(addDays(today, arrivalOffset));
      const expiryDate = formatISO(addDays(today, expiryOffset));

      return {
        id: this.generateId(),
        docNo,
        arrivalDate,
        warehouse,
        responsible,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        qty: quantity,
        unit: product.unit,
        expiryDate,
        supplier: product.supplier,
        status: computeExpiryStatus(expiryDate, arrivalDate),
      } satisfies SupplyRow;
    };

    const rows = [
      buildRow('MEAT-001', 'PO-000851', 0, 30, 120, 'Главный склад', 'Иванов И.'),
      buildRow('MEAT-002', 'PO-000852', -2, 7, 16, 'Кухня', 'Петров П.'),
      buildRow('DAIRY-004', 'PO-000853', -5, -1, 12, 'Бар', 'Сидоров С.'),
    ].filter((row): row is SupplyRow => row !== null);

    return rows;
  }

  private toSupplyProduct(product: Product): SupplyProduct {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      supplier: product.supplierMain ?? undefined,
    } satisfies SupplyProduct;
  }
}
