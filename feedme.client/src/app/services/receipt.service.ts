import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, defer, of } from 'rxjs';

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
  private readonly receiptsSubject = new BehaviorSubject<Receipt[]>([]);

  getAll(): Observable<Receipt[]> {
    return this.receiptsSubject.asObservable();
  }

  saveReceipt(data: CreateReceipt): Observable<Receipt> {
    return this.mutate(() => {
      const receipt = this.createReceipt(data);
      this.receiptsSubject.next([...this.receiptsSubject.value, receipt]);
      return receipt;
    });
  }

  updateReceipt(id: string, data: CreateReceipt): Observable<Receipt> {
    return this.mutate(() => {
      const current = this.receiptsSubject.value;
      const index = current.findIndex(item => item.id === id);

      if (index === -1) {
        throw new Error(`Receipt with id "${id}" was not found.`);
      }

      const updated = this.createReceipt(data, id);
      const copy = [...current];
      copy[index] = updated;
      this.receiptsSubject.next(copy);

      return updated;
    });
  }

  deleteReceipt(id: string): Observable<void> {
    return this.mutate(() => {
      const next = this.receiptsSubject.value.filter(receipt => receipt.id !== id);
      this.receiptsSubject.next(next);
    });
  }

  private mutate<T>(operation: () => T): Observable<T> {
    return defer(() => {
      const result = operation();
      return of(result);
    });
  }

  private createReceipt(data: CreateReceipt, existingId?: string): Receipt {
    if (!data.items?.length) {
      throw new Error('Receipt must contain at least one item.');
    }

    const items = data.items.map(item => this.createReceiptLine(item));
    const totalAmount = items.reduce((sum, line) => sum + line.totalCost, 0);

    return {
      id: existingId ?? this.generateId(),
      number: data.number.trim(),
      supplier: data.supplier.trim(),
      warehouse: data.warehouse.trim(),
      responsible: data.responsible.trim(),
      receivedAt: this.normalizeIsoDate(data.receivedAt),
      items,
      totalAmount,
    } satisfies Receipt;
  }

  private createReceiptLine(line: CreateReceiptLine): ReceiptLine {
    const quantity = this.normalizeNumber(line.quantity);
    const unitPrice = this.normalizeNumber(line.unitPrice);
    const totalCost = Math.round(quantity * unitPrice * 100) / 100;

    return {
      catalogItemId: line.catalogItemId,
      sku: line.sku,
      itemName: line.itemName,
      category: line.category,
      quantity,
      unit: line.unit,
      unitPrice,
      totalCost,
      expiryDate: line.expiryDate ? this.normalizeIsoDate(line.expiryDate) : null,
      status: line.status,
    } satisfies ReceiptLine;
  }

  private normalizeIsoDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ISO date: ${value}`);
    }

    return date.toISOString();
  }

  private normalizeNumber(value: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error('Quantity and price must be finite numbers.');
    }

    return parsed;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `receipt-${Math.random().toString(36).slice(2, 11)}`;
  }
}
