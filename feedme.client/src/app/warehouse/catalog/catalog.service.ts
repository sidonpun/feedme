import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

import {
  CatalogItem,
  CatalogService as CatalogApiService,
} from '../../services/catalog.service';
import { Product } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class WarehouseCatalogService {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);

  constructor() {
    this.refresh()
      .pipe(take(1))
      .subscribe({
        error: () => {
          this.productsSubject.next([]);
        },
      });
  }

  getAll(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  refresh(): Observable<Product[]> {
    return this.catalogApi.getAll().pipe(
      map(items => items.map(item => this.fromCatalogItem(item))),
      tap(products => this.productsSubject.next(products))
    );
  }

  add(product: Product): Observable<Product> {
    const payload = this.toCatalogItem(product);

    return this.catalogApi.create(payload).pipe(
      map(created => this.fromCatalogItem(created)),
      tap(created => {
        this.productsSubject.next([created, ...this.productsSubject.value]);
      })
    );
  }

  private fromCatalogItem(item: CatalogItem): Product {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      sku: item.code,
      category: item.category,
      unit: item.unit,
      unitWeight: this.normalizeNumber(item.weight),
      writeoff: item.writeoffMethod,
      allergens: item.allergens || null,
      needsPacking: item.packagingRequired,
      perishableAfterOpen: item.spoilsAfterOpening,
      supplierMain: item.supplier || null,
      leadTimeDays: this.normalizeNumber(item.deliveryTime),
      costEst: this.normalizeNumber(item.costEstimate),
      vat: item.taxRate || null,
      purchasePrice: this.normalizeNumber(item.unitPrice),
      salePrice: this.normalizeNumber(item.salePrice),
      tnvCode: item.tnved || null,
      marked: item.isMarked,
      alcohol: item.isAlcohol,
      alcoholCode: item.alcoholCode || null,
      alcoholStrength: this.normalizeNumber(item.alcoholStrength),
      alcoholVolume: this.normalizeNumber(item.alcoholVolume),
    } satisfies Product;
  }

  private toCatalogItem(product: Product): Omit<CatalogItem, 'id'> {
    return {
      name: product.name,
      type: product.type,
      code: product.sku,
      category: product.category,
      unit: product.unit,
      weight: product.unitWeight ?? 0,
      writeoffMethod: product.writeoff,
      allergens: product.allergens ?? '',
      packagingRequired: product.needsPacking,
      spoilsAfterOpening: product.perishableAfterOpen,
      supplier: product.supplierMain ?? '',
      deliveryTime: product.leadTimeDays ?? 0,
      costEstimate: product.costEst ?? 0,
      taxRate: product.vat ?? 'Без НДС',
      unitPrice: product.purchasePrice ?? 0,
      salePrice: product.salePrice ?? 0,
      tnved: product.tnvCode ?? '',
      isMarked: product.marked,
      isAlcohol: product.alcohol,
      alcoholCode: product.alcohol ? product.alcoholCode ?? '' : '',
      alcoholStrength: product.alcohol ? product.alcoholStrength ?? 0 : 0,
      alcoholVolume: product.alcohol ? product.alcoholVolume ?? 0 : 0,
    } satisfies Omit<CatalogItem, 'id'>;
  }

  private normalizeNumber(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number.isFinite(value) ? value : null;
  }
}
