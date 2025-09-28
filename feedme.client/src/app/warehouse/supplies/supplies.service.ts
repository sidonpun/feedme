import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { SupplyRow } from '../shared/models';
import { computeExpiryStatus } from '../shared/status.util';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

@Injectable({ providedIn: 'root' })
export class SuppliesService {
  private readonly suppliesSubject = new BehaviorSubject<SupplyRow[]>([]);

  getAll(): Observable<SupplyRow[]> {
    return this.suppliesSubject.asObservable();
  }

  add(row: SupplyRow): Observable<SupplyRow> {
    const newRow: SupplyRow = {
      ...row,
      id: createId('supply'),
      status: computeExpiryStatus(row.expiryDate),
    };

    this.suppliesSubject.next([newRow, ...this.suppliesSubject.value]);
    return of(newRow);
  }
}
