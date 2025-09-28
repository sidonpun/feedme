import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableControlsComponent } from '../table-controls/table-controls.component';

type SortDirection = 'asc' | 'desc';
type SortType = 'string' | 'number' | 'date';
type SortableColumn = 'productName' | 'category' | 'stock' | 'unitPrice' | 'expiryDate' | 'responsible' | 'supplier';

interface SortState {
  column: SortableColumn;
  direction: SortDirection;
}

interface FilterOptions {
  justAdded?: boolean;
  preservePage?: boolean;
}

@Component({
  selector: 'app-supply-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableControlsComponent],
  templateUrl: './supply-table.component.html',
  styleUrls: ['./supply-table.component.css']
})
export class SupplyTableComponent implements OnChanges {
  /** Входной массив поставок */
  @Input() data: any[] = [];
  /** Эмитируем запрос на создание новой поставки */
  @Output() onAddSupply = new EventEmitter<void>();
  /** Сообщаем, что пользователь хочет открыть настройки конкретной поставки */
  @Output() onSettingsClick = new EventEmitter<any>();

  // фильтр и пагинация
  searchQuery = '';
  rowsPerPage = 10;
  currentPage = 1;
  filteredData: any[] = [];

  sortState: SortState | null = null;

  private readonly sortConfig: Record<SortableColumn, SortType> = {
    productName: 'string',
    category: 'string',
    stock: 'number',
    unitPrice: 'number',
    expiryDate: 'date',
    responsible: 'string',
    supplier: 'string',
  };

  /** Храним прошлую длину, чтобы понять, добавили ли новый элемент */
  private prevLength = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const newLength = this.data.length;
      const added = newLength > this.prevLength;
      this.prevLength = newLength;
      this.applyFilters({
        justAdded: added,
        preservePage: added && !this.searchQuery,
      });
    }
  }

  /** Фильтрует, убирает пустые записи и переключает страницу */
  private applyFilters(options: FilterOptions = {}): void {
    const { justAdded = false, preservePage = false } = options;
    // 1) убираем полностью пустые
    const nonEmpty = this.data.filter(item =>
      !!(item.productName?.toString().trim()) ||
      !!(item.category?.toString().trim()) ||
      !!(item.supplier?.toString().trim())
    );

    // 2) поиск
    const q = this.searchQuery.toLowerCase();
    const matches = nonEmpty.filter(item =>
      (item.productName || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.supplier || '').toLowerCase().includes(q)
    );

    this.filteredData = this.sortData(matches);

    // 3) если добавили новую запись и поиск не используется — ставим последнюю страницу
    if (justAdded && !q) {
      this.currentPage = this.totalPages;
      return;
    }

    if (preservePage) {
      this.currentPage = Math.min(this.currentPage, this.totalPages);
    } else {
      this.currentPage = 1;
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onRowsChange(rows: number): void {
    this.rowsPerPage = rows;
    this.applyFilters();
  }

  toggleSort(column: SortableColumn): void {
    const isSameColumn = this.sortState?.column === column;
    const nextDirection: SortDirection = isSameColumn && this.sortState?.direction === 'asc' ? 'desc' : 'asc';
    this.sortState = {
      column,
      direction: nextDirection,
    };
    this.applyFilters({ preservePage: true });
  }

  isSortedBy(column: SortableColumn): boolean {
    return this.sortState?.column === column;
  }

  getSortIcon(column: SortableColumn): string {
    if (this.isSortedBy(column)) {
      return this.sortState?.direction === 'asc' ? '▲' : '▼';
    }
    return '▲▼';
  }

  getAriaSort(column: SortableColumn): 'ascending' | 'descending' | 'none' {
    if (!this.sortState || this.sortState.column !== column) {
      return 'none';
    }
    return this.sortState.direction === 'asc' ? 'ascending' : 'descending';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  addSupply(): void {
    this.onAddSupply.emit();
  }

  private sortData(data: any[]): any[] {
    if (!this.sortState) {
      return [...data];
    }

    const { column, direction } = this.sortState;
    const type = this.sortConfig[column];

    return [...data].sort((a, b) => {
      const aValue = this.getComparableValue(a, column, type);
      const bValue = this.getComparableValue(b, column, type);
      return this.compareValues(aValue, bValue, type, direction);
    });
  }

  private getComparableValue(item: any, column: SortableColumn, type: SortType): string | number {
    switch (column) {
      case 'productName':
        return (item.productName || item.name || '').toString();
      case 'category':
        return (item.category || '').toString();
      case 'responsible':
        return (item.responsible || '').toString();
      case 'supplier':
        return (item.supplier || '').toString();
      case 'stock':
        return this.toNumber(item.stock);
      case 'unitPrice':
        return this.toNumber(item.unitPrice);
      case 'expiryDate':
        return this.toDateValue(item.expiryDate);
      default:
        return type === 'number' ? 0 : '';
    }
  }

  private compareValues(
    a: string | number,
    b: string | number,
    type: SortType,
    direction: SortDirection,
  ): number {
    if (type === 'string') {
      const aStr = (a as string).toString();
      const bStr = (b as string).toString();
      const base = aStr.localeCompare(bStr, 'ru', { sensitivity: 'base' });
      return direction === 'asc' ? base : -base;
    }

    const aNum = a as number;
    const bNum = b as number;

    const aIsNaN = Number.isNaN(aNum);
    const bIsNaN = Number.isNaN(bNum);

    if (aIsNaN && bIsNaN) {
      return 0;
    }

    if (aIsNaN) {
      return 1;
    }

    if (bIsNaN) {
      return -1;
    }

    return direction === 'asc' ? aNum - bNum : bNum - aNum;
  }

  private toNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : Number.NaN;
  }

  private toDateValue(value: unknown): number {
    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'string') {
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? Number.NaN : timestamp;
    }

    return Number.NaN;
  }
}
