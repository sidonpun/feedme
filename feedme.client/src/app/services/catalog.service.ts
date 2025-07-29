import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CatalogItem {
  id: string;
  name: string;
  supplierId: string;
  tnvedCode: string;
  writeoffMethod: string;
  unitPrice: number;
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
}
