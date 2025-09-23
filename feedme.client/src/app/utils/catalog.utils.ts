import { CatalogItem } from '../models/catalog-item.model';

const DEFAULT_STOCK_UNIT = 'шт';

export function sanitizeNumericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value
      .replace(/\s+/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.]/g, '');

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function normalizeCatalogItem(rawItem: any): CatalogItem {
  const stockQuantity =
    sanitizeNumericValue(rawItem?.stockQuantity ?? rawItem?.stock) ?? 0;
  const unitPrice = sanitizeNumericValue(rawItem?.unitPrice ?? rawItem?.price) ?? 0;
  const totalCost = sanitizeNumericValue(rawItem?.totalCost ?? rawItem?.total);
  const expiryDate = normalizeDateValue(rawItem?.expiryDate);

  return {
    id: String(rawItem?.id ?? Date.now().toString()),
    category: String(rawItem?.category ?? ''),
    name: String(rawItem?.name ?? ''),
    stockQuantity,
    stockUnit: resolveStockUnit(rawItem),
    unitPrice,
    warehouse: String(rawItem?.warehouse ?? 'Главный склад'),
    expiryDate,
    supplier: String(rawItem?.supplier ?? 'не задан'),
    totalCost: totalCost ?? undefined,
  };
}

function resolveStockUnit(rawItem: any): string {
  if (rawItem?.stockUnit) {
    return String(rawItem.stockUnit);
  }

  if (typeof rawItem?.stock === 'string') {
    const unit = rawItem.stock.replace(/[0-9.,\s]/g, '');
    if (unit.trim().length > 0) {
      return unit;
    }
  }

  return DEFAULT_STOCK_UNIT;
}

function normalizeDateValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value.includes('/')) {
      const parts = value.split(/[./]/);
      if (parts.length === 3) {
        const [day, month, year] = parts.map(part => part.trim());
        const normalizedDay = day.padStart(2, '0');
        const normalizedMonth = month.padStart(2, '0');
        return `${year}-${normalizedMonth}-${normalizedDay}`;
      }
    }

    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}
