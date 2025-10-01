import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  CreateReceipt,
  Receipt,
  ReceiptService,
} from '../services/receipt.service';
import { SupplyRow, SupplyStatus } from './models';

export type WarehouseMetrics = {
  suppliesLastWeek: number;
  purchaseAmountLastWeek: number;
  positions: number;
  expired: number;
};

export interface CreateSupplyPayload {
  docNo: string;
  arrivalDate: string;
  warehouse: string;
  responsible: string;
  supplier: string;
  productId: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  price: number;
  expiry: string;
  status: SupplyStatus;
}

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly receiptService = inject(ReceiptService);
  private readonly rowsSignal = signal<SupplyRow[]>([]);

  private readonly metricsSignal = computed<WarehouseMetrics>(() =>
    this.computeMetrics(this.rowsSignal()),
  );

  constructor() {
    void this.refresh();
  }

  list = () => this.rowsSignal.asReadonly();

  metrics = () => this.metricsSignal;

  async refresh(): Promise<SupplyRow[]> {
    const receipts = await firstValueFrom(this.receiptService.getAll());
    const rows = receipts
      .map((receipt) => this.mapReceiptToRow(receipt))
      .filter((row): row is SupplyRow => row !== null);

    const sorted = this.sortRowsByRecency(rows);
    this.rowsSignal.set(sorted);
    return sorted;
  }

  metricsForWarehouse(warehouse: string | null): WarehouseMetrics {
    const rows = this.rowsSignal();
    if (!warehouse) {
      return this.computeMetrics(rows);
    }

    return this.computeMetrics(rows.filter((row) => row.warehouse === warehouse));
  }

  async addRow(payload: CreateSupplyPayload): Promise<SupplyRow> {
    const request = this.toReceiptPayload(payload);
    const created = await firstValueFrom(this.receiptService.saveReceipt(request));
    const mapped = this.mapReceiptToRow(created);

    if (!mapped) {
      throw new Error('Созданная поставка не содержит позиций.');
    }

    this.rowsSignal.update((rows) => this.sortRowsByRecency([mapped, ...rows]));
    return mapped;
  }

  async updateRow(row: SupplyRow): Promise<SupplyRow | null> {
    const request = this.toReceiptPayload({
      docNo: row.docNo,
      arrivalDate: row.arrivalDate,
      warehouse: row.warehouse,
      responsible: row.responsible,
      supplier: row.supplier,
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      category: row.category,
      qty: row.qty,
      unit: row.unit,
      price: row.price,
      expiry: row.expiry,
      status: row.status,
    });

    const updated = await firstValueFrom(
      this.receiptService.updateReceipt(row.id, request),
    );

    const mapped = this.mapReceiptToRow(updated);
    if (!mapped) {
      return null;
    }

    this.rowsSignal.update((rows) =>
      this.sortRowsByRecency(
        rows.map((current) => (current.id === row.id ? mapped : current)),
      ),
    );

    return mapped;
  }

  async removeRowsById(ids: readonly string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(ids));
    for (const id of uniqueIds) {
      await firstValueFrom(this.receiptService.deleteReceipt(id));
    }

    this.rowsSignal.update((rows) =>
      rows.filter((row) => !uniqueIds.includes(row.id)),
    );
  }

  private toReceiptPayload(payload: CreateSupplyPayload): CreateReceipt {
    return {
      number: payload.docNo,
      supplier: payload.supplier,
      warehouse: payload.warehouse,
      responsible: payload.responsible,
      receivedAt: this.toUtcIsoString(payload.arrivalDate),
      items: [
        {
          catalogItemId: payload.productId,
          sku: payload.sku,
          itemName: payload.name,
          category: payload.category,
          quantity: payload.qty,
          unit: payload.unit,
          unitPrice: payload.price,
          expiryDate: this.toUtcIsoString(payload.expiry),
          status: payload.status,
        },
      ],
    } satisfies CreateReceipt;
  }

  private mapReceiptToRow(receipt: Receipt): SupplyRow | null {
    const [line] = receipt.items ?? [];
    if (!line) {
      return null;
    }

    return {
      id: receipt.id,
      productId: line.catalogItemId,
      docNo: receipt.number,
      arrivalDate: this.normalizeDateString(receipt.receivedAt),
      warehouse: this.normalizeText(receipt.warehouse, 'Главный склад'),
      responsible: this.normalizeText(receipt.responsible, 'Не назначен'),
      supplier: this.normalizeText(receipt.supplier, 'Не указан'),
      sku: this.normalizeText(line.sku, line.catalogItemId),
      name: this.normalizeText(line.itemName, 'Без названия'),
      category: this.normalizeText(line.category, 'Без категории'),
      qty: Number(line.quantity ?? 0),
      unit: this.normalizeText(line.unit, 'шт'),
      price: Number(line.unitPrice ?? 0),
      expiry: line.expiryDate ? this.normalizeDateString(line.expiryDate) : '',
      status: this.normalizeStatus(line.status),
    } satisfies SupplyRow;
  }

  private normalizeStatus(status: string | null | undefined): SupplyStatus {
    const normalized = (status ?? '').trim().toLowerCase();
    if (normalized === 'warning' || normalized === 'expired') {
      return normalized as SupplyStatus;
    }

    return 'ok';
  }

  private normalizeDateString(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeText(value: string | null | undefined, fallback: string): string {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : fallback;
  }

  private toUtcIsoString(date: string): string {
    const [year, month, day] = date.split('-').map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      throw new Error('Некорректная дата.');
    }

    const utc = Date.UTC(year, month - 1, day);
    return new Date(utc).toISOString();
  }

  private sortRowsByRecency(rows: readonly SupplyRow[]): SupplyRow[] {
    return [...rows].sort((left, right) => this.compareByRecency(left, right));
  }

  private compareByRecency(left: SupplyRow, right: SupplyRow): number {
    const arrivalComparison = this.compareIsoDatesDesc(left.arrivalDate, right.arrivalDate);
    if (arrivalComparison !== 0) {
      return arrivalComparison;
    }

    return right.docNo.localeCompare(left.docNo);
  }

  private compareIsoDatesDesc(left: string, right: string): number {
    const leftTime = this.parseDate(left).getTime();
    const rightTime = this.parseDate(right).getTime();
    return rightTime - leftTime;
  }

  private computeMetrics(rows: readonly SupplyRow[]): WarehouseMetrics {
    const skuSet = new Set<string>();

    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(startOfToday.getDate() - 6);

    let suppliesLastWeek = 0;
    let purchaseAmountLastWeek = 0;
    let expired = 0;

    for (const row of rows) {
      skuSet.add(row.sku);

      const arrivalDate = this.parseDate(row.arrivalDate);
      if (!Number.isNaN(arrivalDate.getTime()) && arrivalDate >= sevenDaysAgo) {
        suppliesLastWeek += 1;
        purchaseAmountLastWeek += row.qty * row.price;
      }

      const expiryDate = this.parseDate(row.expiry);
      if (!Number.isNaN(expiryDate.getTime()) && expiryDate < startOfToday) {
        expired += 1;
      }
    }

    return {
      suppliesLastWeek,
      purchaseAmountLastWeek,
      positions: skuSet.size,
      expired,
    } satisfies WarehouseMetrics;
  }

  private parseDate(value: string): Date {
    if (!value) {
      return new Date(NaN);
    }

    const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return new Date(NaN);
    }

    return new Date(year, month - 1, day);
  }
}
