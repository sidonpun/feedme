import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiUrlService } from './api-url.service';
import { ApiErrorParserService } from './api-error-parser.service';

export type ShelfLifeStatus = 'ok' | 'warning' | 'expired';

export interface ReceiptLine {
  catalogItemId: string;
  sku: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  expiryDate: string | null;
  status: ShelfLifeStatus;
}

export interface Receipt {
  id: string;
  number: string;
  supplier: string;
  warehouse: string;
  responsible: string;
  receivedAt: string;
  items: ReceiptLine[];
  totalAmount: number;
}

export type CreateReceiptLine = Omit<ReceiptLine, 'totalCost'>;

export interface CreateReceipt {
  number: string;
  supplier: string;
  warehouse: string;
  responsible: string;
  receivedAt: string;
  items: CreateReceiptLine[];
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly errorParser = inject(ApiErrorParserService);
  private readonly baseUrl = this.apiUrl.build('receipts');

  getAll(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(this.baseUrl).pipe(
      catchError(error =>
        throwError(() =>
          this.errorParser.create({ method: 'GET', url: this.baseUrl, error }),
        ),
      ),
    );
  }

  saveReceipt(data: CreateReceipt): Observable<Receipt> {
    return this.http.post<Receipt>(this.baseUrl, data).pipe(
      catchError(error =>
        throwError(() =>
          this.errorParser.create({
            method: 'POST',
            url: this.baseUrl,
            payload: data,
            error,
          }),
        ),
      ),
    );
  }

  updateReceipt(id: string, data: CreateReceipt): Observable<Receipt> {
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(id)}`;
    return this.http.put<Receipt>(targetUrl, data).pipe(
      catchError(error =>
        throwError(() =>
          this.errorParser.create({
            method: 'PUT',
            url: targetUrl,
            payload: data,
            error,
          }),
        ),
      ),
    );
  }

  deleteReceipt(id: string): Observable<void> {
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(id)}`;
    return this.http.delete<void>(targetUrl).pipe(
      catchError(error =>
        throwError(() =>
          this.errorParser.create({ method: 'DELETE', url: targetUrl, error }),
        ),
      ),
    );
  }
}
