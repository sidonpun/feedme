import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-warehouse-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-table.component.html',
  styleUrls: ['./warehouse-table.component.css']
})
export class WarehouseTableComponent {
  @Input() data: any[] = [];

  @Output() onSettingsClick = new EventEmitter<any>();
  @Output() onEditStockClick = new EventEmitter<{ index: number, stock: number }>();

  handleSettingsClick(item: any, event: MouseEvent) {
    event.stopPropagation();
    this.onSettingsClick.emit(item);
  }

  handleEditStockClick(index: number, stock: number) {
    this.onEditStockClick.emit({ index, stock });
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Заготовка':
        return 'assets/Zagotovka.svg';
      case 'Готовое блюдо':
        return 'assets/Readyfood.svg';
      case 'Добавка':
        return 'assets/Toping.svg';
      case 'Товар':
      default:
        return 'assets/default.svg';
    }
  }
}
