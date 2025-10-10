import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiUrlService } from './api-url.service';

export type InventoryStatus = 'draft' | 'in-progress' | 'completed' | 'cancelled';

export interface InventoryLine {
  readonly catalogItemId: string;
  readonly sku: string;
  readonly itemName: string;
  readonly category: string;
  readonly expectedQuantity: number;
  readonly countedQuantity: number;
  readonly differenceQuantity: number;
  readonly unit: string;
  readonly unitPrice: number;
  readonly expectedCost: number;
  readonly countedCost: number;
  readonly differenceCost: number;
}

export interface InventoryDocument {
  readonly id: string;
  readonly number: string;
  readonly warehouse: string;
  readonly responsible: string;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly status: InventoryStatus;
  readonly totalExpected: number;
  readonly totalCounted: number;
  readonly totalDifference: number;
  readonly positions: number;
  readonly items: ReadonlyArray<InventoryLine>;
}

export interface InventoryLinePayload {
  readonly catalogItemId: string;
  readonly sku: string;
  readonly itemName: string;
  readonly category: string;
  readonly expectedQuantity: number;
  readonly countedQuantity: number;
  readonly unit: string;
  readonly unitPrice: number;
}

export interface UpsertInventoryPayload {
  readonly number: string;
  readonly warehouse: string;
  readonly responsible: string;
  readonly startedAt: string;
  readonly completedAt?: string | null;
  readonly status: InventoryStatus;
  readonly items: ReadonlyArray<InventoryLinePayload>;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly baseUrl = this.apiUrl.build('inventories');

  getAll(): Observable<InventoryDocument[]> {
    return this.http
      .get<InventoryResponseDto[]>(this.baseUrl)
      .pipe(map((dtos) => dtos.map((dto) => this.fromDto(dto))));
  }

  create(payload: UpsertInventoryPayload): Observable<InventoryDocument> {
    const request = this.toRequestDto(payload);
    return this.http
      .post<InventoryResponseDto>(this.baseUrl, request)
      .pipe(map((dto) => this.fromDto(dto)));
  }

  update(id: string, payload: UpsertInventoryPayload): Observable<InventoryDocument> {
    const normalizedId = this.normalizeId(id);
    const request = this.toRequestDto(payload, normalizedId);
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(normalizedId)}`;

    return this.http
      .put<InventoryResponseDto>(targetUrl, request)
      .pipe(map((dto) => this.fromDto(dto)));
  }

  delete(id: string): Observable<void> {
    const normalizedId = this.normalizeId(id);
    const targetUrl = `${this.baseUrl}/${encodeURIComponent(normalizedId)}`;
    return this.http.delete<void>(targetUrl);
  }

  private fromDto(dto: InventoryResponseDto): InventoryDocument {
    return {
      id: dto.id,
      number: dto.number,
      warehouse: dto.warehouse,
      responsible: dto.responsible,
      startedAt: this.normalizeIsoString(dto.startedAt),
      completedAt: dto.completedAt ? this.normalizeIsoString(dto.completedAt) : null,
      status: this.normalizeStatus(dto.status),
      totalExpected: this.toNumber(dto.totalExpected),
      totalCounted: this.toNumber(dto.totalCounted),
      totalDifference: this.toNumber(dto.totalDifference),
      positions: dto.positions,
      items: (dto.items ?? []).map((item) => this.fromLineDto(item)),
    } satisfies InventoryDocument;
  }

  private fromLineDto(dto: InventoryLineResponseDto): InventoryLine {
    return {
      catalogItemId: dto.catalogItemId,
      sku: dto.sku,
      itemName: dto.itemName,
      category: dto.category,
      expectedQuantity: this.toNumber(dto.expectedQuantity),
      countedQuantity: this.toNumber(dto.countedQuantity),
      differenceQuantity: this.toNumber(dto.differenceQuantity),
      unit: dto.unit,
      unitPrice: this.toNumber(dto.unitPrice),
      expectedCost: this.toNumber(dto.expectedCost),
      countedCost: this.toNumber(dto.countedCost),
      differenceCost: this.toNumber(dto.differenceCost),
    } satisfies InventoryLine;
  }

  private toRequestDto(payload: UpsertInventoryPayload, id?: string): InventoryRequestDto {
    if (!payload.items?.length) {
      throw new Error('Inventory document must contain at least one item.');
    }

    return {
      ...(id ? { id } : {}),
      number: this.normalizeRequiredText(payload.number, 'number'),
      warehouse: this.normalizeRequiredText(payload.warehouse, 'warehouse'),
      responsible: this.normalizeOptionalText(payload.responsible),
      startedAt: this.normalizeIsoString(payload.startedAt),
      completedAt: payload.completedAt ? this.normalizeIsoString(payload.completedAt) : null,
      status: this.normalizeStatus(payload.status),
      items: payload.items.map((item) => this.toLineRequestDto(item)),
    };
  }

  private toLineRequestDto(line: InventoryLinePayload): InventoryLineRequestDto {
    return {
      catalogItemId: this.normalizeRequiredText(line.catalogItemId, 'catalogItemId'),
      sku: this.normalizeRequiredText(line.sku, 'sku'),
      itemName: this.normalizeRequiredText(line.itemName, 'itemName'),
      category: this.normalizeRequiredText(line.category, 'category'),
      expectedQuantity: this.toNumber(line.expectedQuantity),
      countedQuantity: this.toNumber(line.countedQuantity),
      unit: this.normalizeRequiredText(line.unit, 'unit'),
      unitPrice: this.toNumber(line.unitPrice),
    };
  }

  private normalizeIsoString(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }

    return parsed.toISOString();
  }

  private normalizeRequiredText(value: string, field: string): string {
    const normalized = (value ?? '').trim();
    if (normalized.length === 0) {
      throw new Error(`Field "${field}" is required.`);
    }
    return normalized;
  }

  private normalizeOptionalText(value: string | null | undefined): string {
    return (value ?? '').trim();
  }

  private normalizeStatus(value: string | null | undefined): InventoryStatus {
    const normalized = (value ?? '').trim().toLowerCase();
    if (normalized === 'in-progress') {
      return 'in-progress';
    }
    if (normalized === 'completed') {
      return 'completed';
    }
    if (normalized === 'cancelled') {
      return 'cancelled';
    }
    return 'draft';
  }

  private toNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      return 0;
    }
    return parsed;
  }

  private normalizeId(id: string): string {
    const normalized = id?.trim();
    if (!normalized) {
      throw new Error('Identifier is required.');
    }
    return normalized;
  }
}

type InventoryLineResponseDto = {
  catalogItemId: string;
  sku: string;
  itemName: string;
  category: string;
  expectedQuantity: number;
  countedQuantity: number;
  differenceQuantity: number;
  unit: string;
  unitPrice: number;
  expectedCost: number;
  countedCost: number;
  differenceCost: number;
};

type InventoryResponseDto = {
  id: string;
  number: string;
  warehouse: string;
  responsible: string;
  startedAt: string;
  completedAt: string | null;
  status: InventoryStatus;
  totalExpected: number;
  totalCounted: number;
  totalDifference: number;
  positions: number;
  items: InventoryLineResponseDto[];
};

type InventoryLineRequestDto = {
  catalogItemId: string;
  sku: string;
  itemName: string;
  category: string;
  expectedQuantity: number;
  countedQuantity: number;
  unit: string;
  unitPrice: number;
};

type InventoryRequestDto = {
  id?: string;
  number: string;
  warehouse: string;
  responsible: string;
  startedAt: string;
  completedAt: string | null;
  status: InventoryStatus;
  items: InventoryLineRequestDto[];
};
