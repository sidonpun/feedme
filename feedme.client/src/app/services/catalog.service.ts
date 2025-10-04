import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MonoTypeOperatorFunction, Observable, throwError, retry, timer } from 'rxjs';
import { ApiUrlService } from './api-url.service';

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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly baseUrl = this.apiUrl.build('catalog');
  private static readonly retryAttempts = 3;
  private static readonly retryBaseDelayMs = 250;
  private static readonly retryMaxDelayMs = 2000;
  private static readonly transientStatuses = new Set([0, 502, 503, 504]);

  getAll(): Observable<CatalogItem[]> {
    return this.http
      .get<CatalogItem[]>(this.baseUrl)
      .pipe(this.retryOnTransientNetworkFailure());
  }

  getById(id: string): Observable<CatalogItem> {
    return this.http
      .get<CatalogItem>(`${this.baseUrl}/${id}`)
      .pipe(this.retryOnTransientNetworkFailure());
  }

  create(item: Omit<CatalogItem, 'id'>): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(this.baseUrl, item);
  }

  delete(id: string): Observable<void> {
    const normalizedId = id?.trim();

    if (!normalizedId) {
      return throwError(() => new Error('Catalog item identifier is required.'));
    }

    const targetUrl = `${this.baseUrl}/${encodeURIComponent(normalizedId)}`;
    return this.http.delete<void>(targetUrl);
  }

  private retryOnTransientNetworkFailure<T>(): MonoTypeOperatorFunction<T> {
    return retry({
      count: CatalogService.retryAttempts,
      delay: (error, retryIndex) => {
        if (!this.isTransientNetworkError(error)) {
          throw error;
        }

        return timer(
          Math.min(
            CatalogService.retryBaseDelayMs * 2 ** Math.max(retryIndex - 1, 0),
            CatalogService.retryMaxDelayMs
          )
        );
      },
      resetOnSuccess: true
    });
  }

  private isTransientNetworkError(error: unknown): error is HttpErrorResponse {
    return error instanceof HttpErrorResponse && CatalogService.transientStatuses.has(error.status);
  }
}
