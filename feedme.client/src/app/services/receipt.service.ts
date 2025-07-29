import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly baseUrl = '/api/receipts';

  constructor(private http: HttpClient) {}

  saveReceipt(data: any): Observable<void> {
    return this.http.post<void>(this.baseUrl, data);
  }
}
