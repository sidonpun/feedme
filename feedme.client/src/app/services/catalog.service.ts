import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CatalogItem {
  id: string;
  name: string;
  type: string;
  code: string;
  category: string;
  unit: string;
  weight: number;
  writeoffMethod: string;
  allergens: string;
  packagingRequired: boolean;
  spoilsAfterOpening: boolean;
  supplier: string;
  deliveryTime: number;
  costEstimate: number;
  taxRate: string;
  unitPrice: number;
  salePrice: number;
  tnved: string;
  isMarked: boolean;
  isAlcohol: boolean;
  alcoholCode: string;
  alcoholStrength: number;
  alcoholVolume: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly baseUrl = '/api/catalog';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(this.baseUrl);
  }

  getById(id: string): Observable<CatalogItem> {
    return this.http.get<CatalogItem>(`${this.baseUrl}/${id}`);
  }

  create(item: Omit<CatalogItem, 'id'>): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(this.baseUrl, item);
  }
}
