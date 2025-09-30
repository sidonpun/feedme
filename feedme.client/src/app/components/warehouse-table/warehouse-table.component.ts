import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface WarehouseTableRow {
  supplyDate?: string;
  name?: string;
  category?: string;
  totalCost?: number | string;
  unitPrice?: number | string;
  stock?: number | string;
  supplyQuantity?: number | string;
  receivedQuantity?: number | string;
  quantity?: number | string;
  qty?: number | string;
  incomingQuantity?: number | string;
  expiryDate?: string;
}

@Component({
  selector: 'app-warehouse-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-table.component.html',
  styleUrls: ['./warehouse-table.component.css'],
})
export class WarehouseTableComponent {
  private static readonly quantityKeys: (keyof WarehouseTableRow)[] = [
    'supplyQuantity',
    'receivedQuantity',
    'quantity',
    'qty',
    'incomingQuantity',
  ];

  private static readonly numberFormatter = new Intl.NumberFormat('ru-RU');

  @Input() data: WarehouseTableRow[] = [];

  @Output() readonly onSettingsClick = new EventEmitter<WarehouseTableRow>();
  @Output() readonly onEditStockClick = new EventEmitter<{ index: number; stock: number | string }>();

  handleSettingsClick(item: WarehouseTableRow, event: MouseEvent): void {
    event.stopPropagation();
    this.onSettingsClick.emit(item);
  }

  handleEditStockClick(index: number, stock: number | string): void {
    this.onEditStockClick.emit({ index, stock });
  }

  getCategoryIcon(category: string | undefined): string {
    switch (category) {
      case 'Заготовка':
        return 'assets/Zagotovka.svg';
      case 'Готовое блюдо':
        return 'assets/Readyfood.svg';
      case 'Добавка':
        return 'assets/Toping.svg';
      case 'Товар':
        return 'assets/default.svg';
      default:
        return 'assets/default.svg';
    }
  }

  getSupplyQuantity(row: WarehouseTableRow): string {
    const explicitValue = WarehouseTableComponent.quantityKeys
      .map((key) => row[key])
      .find((value) => this.isPresent(value));

    if (this.isPresent(explicitValue)) {
      return this.formatQuantity(explicitValue);
    }

    if (this.isPresent(row.stock)) {
      return this.formatQuantity(row.stock);
    }

    return '—';
  }

  private isPresent(value: unknown): value is string | number {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  }

  private formatQuantity(value: string | number): string {
    if (typeof value === 'number') {
      return WarehouseTableComponent.numberFormatter.format(value);
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return WarehouseTableComponent.numberFormatter.format(numericValue);
    }

    return value;
  }
}
