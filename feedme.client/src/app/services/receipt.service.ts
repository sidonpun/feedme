import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

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
    return this.http
      .get<ReceiptDto[]>(this.baseUrl)
      .pipe(map((dtos) => dtos.map((dto) => this.fromDto(dto))));
  }

  saveReceipt(data: CreateReceipt): Observable<Receipt> {
    const payload = this.toRequestDto(data);
    return this.http
      .post<ReceiptDto>(this.baseUrl, payload)
      .pipe(map((dto) => this.fromDto(dto)));
  }

  updateReceipt(id: string, data: CreateReceipt): Observable<Receipt> {
    const normalizedId = this.normalizeId(id);
    const payload = this.toRequestDto(data, normalizedId);
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(normalizedId)}`;

    return this.http
      .put<ReceiptDto>(targetUrl, payload)
      .pipe(map((dto) => this.fromDto(dto)));
  }

  deleteReceipt(id: string): Observable<void> {
    const normalizedId = this.normalizeId(id);
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(normalizedId)}`;
    return this.http.delete<void>(targetUrl);
  }

  private fromDto(dto: ReceiptDto): Receipt {
    return {
      id: dto.id,
      number: dto.number,
      supplier: dto.supplier,
      warehouse: dto.warehouse,
      responsible: dto.responsible,
      receivedAt: this.normalizeIsoString(dto.receivedAt),
      items: (dto.items ?? []).map((item) => this.fromLineDto(item)),
      totalAmount: this.toNumber(dto.totalAmount),
    } satisfies Receipt;
  }

  private fromLineDto(dto: ReceiptLineDto): ReceiptLine {
    return {
      catalogItemId: dto.catalogItemId,
      sku: dto.sku,
      itemName: dto.itemName,
      category: dto.category,
      quantity: this.toNumber(dto.quantity),
      unit: dto.unit,
      unitPrice: this.toNumber(dto.unitPrice),
      totalCost: this.toNumber(dto.totalCost),
      expiryDate: dto.expiryDate ? this.normalizeIsoString(dto.expiryDate) : null,
      status: this.normalizeStatus(dto.status),
    } satisfies ReceiptLine;
  }

  private toRequestDto(data: CreateReceipt, id?: string): ReceiptRequestDto {
    if (!data.items?.length) {
      throw new Error('Receipt must contain at least one item.');
    }

    return {
      ...(id ? { id } : {}),
      number: this.normalizeRequiredText(data.number, 'number'),
      supplier: this.normalizeRequiredText(data.supplier, 'supplier'),
      warehouse: this.normalizeOptionalText(data.warehouse),
      responsible: this.normalizeOptionalText(data.responsible),
      receivedAt: this.normalizeIsoString(data.receivedAt),
      items: data.items.map((line) => this.toRequestLineDto(line)),
    } satisfies ReceiptRequestDto;
  }

  private toRequestLineDto(line: CreateReceiptLine): ReceiptLineRequestDto {
    return {
      catalogItemId: this.normalizeRequiredText(line.catalogItemId, 'catalogItemId'),
      sku: this.normalizeRequiredText(line.sku, 'sku'),
      itemName: this.normalizeRequiredText(line.itemName, 'itemName'),
      category: this.normalizeRequiredText(line.category, 'category'),
      quantity: this.toNumber(line.quantity),
      unit: this.normalizeRequiredText(line.unit, 'unit'),
      unitPrice: this.toNumber(line.unitPrice),
      expiryDate: line.expiryDate ? this.normalizeIsoString(line.expiryDate) : null,
      status: this.normalizeStatus(line.status),
    } satisfies ReceiptLineRequestDto;
  }

  private normalizeId(id: string): string {
    const normalized = id?.trim();
    if (!normalized) {
      throw new Error('Receipt identifier is required.');
    }
    return normalized;
  }

  private normalizeRequiredText(value: string, field: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new Error(`Field "${field}" is required.`);
    }
    return normalized;
  }

  private normalizeOptionalText(value: string): string {
    return value?.trim() ?? '';
  }

  private normalizeIsoString(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ISO date: ${value}`);
    }

    return date.toISOString();
  }

  private normalizeStatus(status: string): ShelfLifeStatus {
    const normalized = (status ?? '').trim().toLowerCase();
    if (normalized === 'ok' || normalized === 'warning' || normalized === 'expired') {
      return normalized;
    }

    return 'ok';
  }

  private toNumber(value: number | string): number {
    const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
    if (!Number.isFinite(parsed)) {
      throw new Error('Numeric value must be finite.');
    }
    return parsed;
  }
}

type ReceiptDto = {
  id: string;
  number: string;
  supplier: string;
  warehouse: string;
  responsible: string;
  receivedAt: string;
  items: ReceiptLineDto[];
  totalAmount: number;
};

type ReceiptLineDto = {
  catalogItemId: string;
  sku: string;
  itemName: string;
  category: string;
  quantity: number | string;
  unit: string;
  unitPrice: number | string;
  totalCost: number | string;
  expiryDate: string | null;
  status: string;
};

type ReceiptRequestDto = {
  id?: string;
  number: string;
  supplier: string;
  warehouse: string;
  responsible: string;
  receivedAt: string;
  items: ReceiptLineRequestDto[];
};

type ReceiptLineRequestDto = {
  catalogItemId: string;
  sku: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  expiryDate: string | null;
  status: ShelfLifeStatus;
};
