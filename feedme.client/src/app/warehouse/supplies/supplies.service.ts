import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import { Product, SupplyProduct, SupplyRow } from '../shared/models';
import { computeExpiryStatus } from '../shared/status.util';
import { WarehouseCatalogService } from '../catalog/catalog.service';
import { CreateReceipt, Receipt, ReceiptService } from '../../services/receipt.service';

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private readonly catalogService = inject(WarehouseCatalogService);
  private readonly receiptService = inject(ReceiptService);

  private readonly productsSubject = new BehaviorSubject<SupplyProduct[]>([]);
  private readonly rowsSubject = new BehaviorSubject<SupplyRow[]>([]);
  private productMap = new Map<string, SupplyProduct>();

  constructor() {
    this.catalogService.getAll().subscribe(products => {
      this.updateProducts(products);
    });

    this.catalogService
      .refresh()
      .pipe(take(1))
      .subscribe({
        next: products => {
          this.updateProducts(products);
        },
        error: () => {
          this.productsSubject.next([]);
        },
      });

    this.loadRowsFromServer();
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
    const normalized: Omit<SupplyRow, 'id'> = {
      docNo: payload.docNo.trim(),
      arrivalDate: payload.arrivalDate,
      warehouse: payload.warehouse.trim(),
      responsible: payload.responsible?.trim() || undefined,
      productId: payload.productId,
      sku: payload.sku,
      name: payload.name,
      qty: payload.qty,
      unit: payload.unit,
      expiryDate: payload.expiryDate,
      supplier: payload.supplier?.trim() || undefined,
      status: computeExpiryStatus(payload.expiryDate, payload.arrivalDate),
    } satisfies Omit<SupplyRow, 'id'>;

    const request = this.toReceiptPayload(normalized);

    return this.receiptService.saveReceipt(request).pipe(
      map(receipt => {
        const created = this.mapReceiptToRow(receipt);
        if (!created) {
          throw new Error('Ответ сервера не содержит данных о поставке.');
        }

        return created;
      }),
      tap(created => {
        this.rowsSubject.next(
          this.sortRows([
            created,
            ...this.rowsSubject.value.filter(existing => existing.id !== created.id),
          ]),
        );
      }),
    );
  }

  private toSupplyProduct(product: Product): SupplyProduct {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      category: product.category,
      supplier: product.supplierMain ?? undefined,
      purchasePrice: product.purchasePrice,
    } satisfies SupplyProduct;
  }

  private updateProducts(products: readonly Product[]): void {
    const mapped = products.map(product => this.toSupplyProduct(product));
    this.productMap = new Map(mapped.map(product => [product.id, product]));
    this.productsSubject.next(mapped);
  }

  private loadRowsFromServer(): void {
    this.receiptService
      .getAll()
      .pipe(
        take(1),
        map(receipts =>
          receipts
            .map(receipt => this.mapReceiptToRow(receipt))
            .filter((row): row is SupplyRow => row !== null),
        ),
      )
      .subscribe({
        next: rows => {
          this.rowsSubject.next(this.sortRows(rows));
        },
        error: () => {
          this.rowsSubject.next([]);
        },
      });
  }

  private mapReceiptToRow(receipt: Receipt): SupplyRow | null {
    if (!receipt) {
      return null;
    }

    const [line] = receipt.items ?? [];
    if (!line) {
      return null;
    }

    return {
      id: receipt.id,
      docNo: this.normalizeText(receipt.number),
      arrivalDate: this.normalizeDateString(receipt.receivedAt),
      warehouse: this.normalizeText(receipt.warehouse, 'Главный склад'),
      responsible: this.normalizeOptionalText(receipt.responsible),
      productId: this.normalizeText(line.catalogItemId),
      sku: this.normalizeText(line.sku),
      name: this.normalizeText(line.itemName, 'Без названия'),
      qty: Number(line.quantity ?? 0),
      unit: this.normalizeText(line.unit, 'шт'),
      expiryDate: line.expiryDate ? this.normalizeDateString(line.expiryDate) : '',
      supplier: this.normalizeOptionalText(receipt.supplier),
      status: this.normalizeStatus(line.status, receipt.receivedAt, line.expiryDate),
    } satisfies SupplyRow;
  }

  private normalizeText(value: string | null | undefined, fallback = ''): string {
    const normalized = (value ?? '').trim();
    return normalized || fallback;
  }

  private normalizeOptionalText(value: string | null | undefined): string | undefined {
    const normalized = this.normalizeText(value);
    return normalized || undefined;
  }

  private normalizeDateString(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeStatus(
    status: string | null | undefined,
    arrival: string | Date | null | undefined,
    expiry: string | Date | null | undefined,
  ): SupplyRow['status'] {
    const normalized = (status ?? '').trim().toLowerCase();
    if (normalized === 'ok' || normalized === 'warning' || normalized === 'expired') {
      return normalized;
    }

    return computeExpiryStatus(expiry, arrival);
  }

  private sortRows(rows: readonly SupplyRow[]): SupplyRow[] {
    return [...rows].sort((left, right) => {
      const dateCompare = right.arrivalDate.localeCompare(left.arrivalDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return right.docNo.localeCompare(left.docNo);
    });
  }

  private toReceiptPayload(row: Omit<SupplyRow, 'id'>): CreateReceipt {
    const product = this.productMap.get(row.productId);
    const unitPrice = this.normalizeNumber(product?.purchasePrice);

    return {
      number: row.docNo,
      supplier: row.supplier ?? product?.supplier ?? '',
      warehouse: row.warehouse,
      responsible: row.responsible ?? '',
      receivedAt: this.toUtcIsoString(row.arrivalDate),
      items: [
        {
          catalogItemId: row.productId,
          sku: row.sku,
          itemName: row.name,
          category: product?.category ?? 'Без категории',
          quantity: row.qty,
          unit: row.unit,
          unitPrice,
          expiryDate: row.expiryDate ? this.toUtcIsoString(row.expiryDate) : null,
          status: row.status,
        },
      ],
    } satisfies CreateReceipt;
  }

  private toUtcIsoString(value: string): string {
    if (!value) {
      throw new Error('Дата должна быть указана.');
    }

    const [year, month, day] = value.split('-').map(part => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      throw new Error(`Некорректная дата: ${value}`);
    }

    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return utcDate.toISOString();
  }

  private normalizeNumber(value: number | null | undefined): number {
    return Number.isFinite(value) && value !== null ? value : 0;
  }
}
