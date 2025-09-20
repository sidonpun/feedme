import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiUrlService } from './api-url.service';

export interface ReceiptLine {
  catalogItemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
}

export interface Receipt {
  id: string;
  number: string;
  supplier: string;
  warehouse: string;
  receivedAt: string;
  items: ReceiptLine[];
  totalAmount: number;
}

export type CreateReceiptLine = Omit<ReceiptLine, 'totalCost'>;

export interface CreateReceipt {
  number: string;
  supplier: string;
  warehouse: string;
  receivedAt: string;
  items: CreateReceiptLine[];
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly baseUrl = this.apiUrl.build('/api/receipts');

  saveReceipt(data: CreateReceipt): Observable<Receipt> {
    return this.http.post<Receipt>(this.baseUrl, data);
  }
}
