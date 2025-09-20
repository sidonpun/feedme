import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receipt } from '../models/receipt';
import { ApiUrlService } from './api-url.service';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly baseUrl = this.apiUrl.build('/api/receipts');

  saveReceipt(receipt: Receipt): Observable<Receipt> {
    return this.http.post<Receipt>(this.baseUrl, receipt);
  }
}
