import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import { Product, SupplyProduct, SupplyRow } from '../shared/models';
import { WarehouseCatalogService } from '../catalog/catalog.service';
import { CreateSupplyDto, SuppliesApiService, SupplyDto } from '../../services/supplies-api.service';
import { SUPPLY_STATUSES, SupplyStatus } from '../shared/supply-status';

export interface CreateSupplyPayload {
  readonly docNo: string;
  readonly productId: string;
  readonly quantity: number;
  readonly arrivalDate: string;
  readonly expiryDate: string;
  readonly warehouse: string;
  readonly responsible?: string;
}

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private readonly catalogService = inject(WarehouseCatalogService);
  private readonly api = inject(SuppliesApiService);

  private readonly productsSubject = new BehaviorSubject<SupplyProduct[]>([]);
  private readonly rowsSubject = new BehaviorSubject<SupplyRow[]>([]);
  private productMap = new Map<string, SupplyProduct>();

  constructor() {
    this.catalogService.getAll().subscribe(products => this.updateProducts(products));

    this.catalogService
      .refresh()
      .pipe(take(1))
      .subscribe({
        next: products => this.updateProducts(products),
        error: () => this.productsSubject.next([]),
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

  add(payload: CreateSupplyPayload): Observable<SupplyRow> {
    const request: CreateSupplyDto = {
      catalogItemId: payload.productId,
      quantity: payload.quantity,
      arrivalDate: payload.arrivalDate,
      expiryDate: payload.expiryDate || null,
      warehouse: payload.warehouse,
      responsible: payload.responsible?.trim() || undefined,
      documentNumber: payload.docNo.trim() || undefined,
    } satisfies CreateSupplyDto;

    return this.api.create(request).pipe(
      map(dto => this.mapDtoToRow(dto)),
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

  private updateProducts(products: readonly Product[]): void {
    const mapped = products.map(product => this.toSupplyProduct(product));
    this.productMap = new Map(mapped.map(product => [product.id, product]));
    this.productsSubject.next(mapped);
  }

  private loadRowsFromServer(): void {
    this.api
      .getAll()
      .pipe(
        take(1),
        map(items => items.map(dto => this.mapDtoToRow(dto))),
      )
      .subscribe({
        next: rows => this.rowsSubject.next(this.sortRows(rows)),
        error: () => this.rowsSubject.next([]),
      });
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

  private mapDtoToRow(dto: SupplyDto): SupplyRow {
    return {
      id: dto.id,
      docNo: dto.documentNumber,
      arrivalDate: this.toDateOnly(dto.arrivalDate),
      warehouse: dto.warehouse,
      responsible: dto.responsible || undefined,
      productId: dto.catalogItemId,
      sku: dto.sku,
      name: dto.productName,
      qty: dto.quantity,
      unit: dto.unit,
      expiryDate: dto.expiryDate ? this.toDateOnly(dto.expiryDate) : '',
      supplier: dto.supplier || undefined,
      status: this.normalizeStatus(dto.status, dto.expiryDate, dto.arrivalDate),
    } satisfies SupplyRow;
  }

  private normalizeStatus(status: SupplyStatus, expiry: string | null, arrival: string): SupplyStatus {
    if (!SUPPLY_STATUSES.includes(status)) {
      return 'ok';
    }

    if (!expiry) {
      return status;
    }

    const expiryDate = new Date(expiry);
    const arrivalDate = new Date(arrival);
    if (Number.isNaN(expiryDate.getTime()) || Number.isNaN(arrivalDate.getTime())) {
      return status;
    }

    if (expiryDate <= arrivalDate && status === 'ok') {
      return 'expired';
    }

    return status;
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

  private toDateOnly(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
