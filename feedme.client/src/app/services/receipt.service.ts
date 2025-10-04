import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from './api-url.service';

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
  private readonly baseUrl = this.apiUrl.build('receipts');

  getAll(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(this.baseUrl);
  }

  saveReceipt(data: CreateReceipt): Observable<Receipt> {
    return this.http.post<Receipt>(this.baseUrl, data);
  }

  updateReceipt(id: string, data: CreateReceipt): Observable<Receipt> {
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(id)}`;
    return this.http.put<Receipt>(targetUrl, data);
  }

  deleteReceipt(id: string): Observable<void> {
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(id)}`;
    return this.http.delete<void>(targetUrl);
  }
}
