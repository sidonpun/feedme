import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiUrlService } from './api-url.service';
import { SupplyStatus } from '../warehouse/shared/supply-status';

export interface SupplyDto {
  readonly id: string;
  readonly documentNumber: string;
  readonly arrivalDate: string;
  readonly warehouse: string;
  readonly responsible: string;
  readonly catalogItemId: string;
  readonly productName: string;
  readonly sku: string;
  readonly category: string;
  readonly quantity: number;
  readonly unit: string;
  readonly expiryDate: string | null;
  readonly supplier: string;
  readonly status: SupplyStatus;
  readonly unitPrice: number;
  readonly createdAt: string;
}

export interface CreateSupplyDto {
  readonly catalogItemId: string;
  readonly quantity: number;
  readonly arrivalDate: string;
  readonly expiryDate?: string | null;
  readonly warehouse?: string;
  readonly responsible?: string;
  readonly documentNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class SuppliesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly baseUrl = this.apiUrl.build('supplies');

  getAll(limit?: number): Observable<SupplyDto[]> {
    const url = typeof limit === 'number' ? `${this.baseUrl}?limit=${Math.max(limit, 1)}` : this.baseUrl;
    return this.http.get<SupplyDto[]>(url);
  }

  create(payload: CreateSupplyDto): Observable<SupplyDto> {
    return this.http.post<SupplyDto>(this.baseUrl, payload);
  }
}
