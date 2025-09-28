import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { Product } from '../shared/models';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly productsSubject = new BehaviorSubject<Product[]>([
    {
      id: createId('product'),
      name: 'Курица гриль',
      type: 'Товар',
      sku: 'MEAT-001',
      category: 'Горячие блюда',
      unit: 'кг',
      unitWeight: 1,
      writeoff: 'FIFO',
      allergens: 'Соя',
      needsPacking: false,
      perishableAfterOpen: true,
      supplierMain: 'ООО «Курица Дуо»',
      leadTimeDays: 3,
      costEst: 180,
      vat: '10%',
      purchasePrice: 220,
      salePrice: 390,
      tnvCode: '1602310000',
      marked: false,
      alcohol: false,
    },
    {
      id: createId('product'),
      name: 'Сок апельсиновый',
      type: 'Товар',
      sku: 'DRINK-014',
      category: 'Напитки',
      unit: 'л',
      unitWeight: 1,
      writeoff: 'FEFO',
      allergens: 'Цитрусовые',
      needsPacking: false,
      perishableAfterOpen: true,
      supplierMain: 'ООО «ФруктСнаб»',
      leadTimeDays: 5,
      costEst: 45,
      vat: '20%',
      purchasePrice: 65,
      salePrice: 120,
      tnvCode: '2009192000',
      marked: false,
      alcohol: false,
    },
  ]);

  getAll(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  add(product: Product): Observable<Product> {
    const newProduct: Product = {
      ...product,
      id: createId('product'),
    };

    this.productsSubject.next([newProduct, ...this.productsSubject.value]);
    return of(newProduct);
  }
}
