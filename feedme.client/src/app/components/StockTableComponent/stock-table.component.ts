import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableControlsComponent } from '../table-controls/table-controls.component';
import { EmptyStateComponent } from '../../warehouse/ui/empty-state.component';
import { sortBySelector, SortDirection, toggleDirection } from '../../utils/sort.util';
import { computeExpiryStatus } from '../../warehouse/shared/status.util';

type ExpiryState = 'ok' | 'warn' | 'danger';

interface ExpiryStatus {
  readonly state: ExpiryState;
  readonly label: string;
  readonly badgeClass: string;
}

interface ExpiryInfo {
  readonly date: Date | null;
  readonly status: ExpiryStatus | null;
}

interface StockTableItem {
  name?: string;

  productName?: string;

  category?: string;
  expiryDate?: string | Date;
  arrivalDate?: string | Date;
  unitPrice?: string | number;
  totalCost?: string | number;
  stock?: string | number;
}

interface FilterOptions {
  justAdded?: boolean;
  preservePage?: boolean;
}

interface StockColumn {
  label: string;
  field: keyof StockTableItem;
  valueAccessor?: (item: StockTableItem) => unknown;
}

@Component({
  selector: 'app-stock-table',
  standalone: true,
  imports: [CommonModule, TableControlsComponent, EmptyStateComponent],
  templateUrl: './stock-table.component.html',
  styleUrls: ['./stock-table.component.css']
})
export class StockTableComponent implements OnChanges {
  @Input() data: StockTableItem[] = [];
  @Output() onSettingsClick = new EventEmitter<StockTableItem>();

  searchQuery = '';
  rowsPerPage = 10;
  currentPage = 1;
  filteredData: StockTableItem[] = [];

  private expiryInfoCache = new WeakMap<StockTableItem, ExpiryInfo>();

  getExpiryInfo(item: StockTableItem): ExpiryInfo {
    const cached = this.expiryInfoCache.get(item);
    if (cached) {
      return cached;
    }

    const info = this.createExpiryInfo(item);
    this.expiryInfoCache.set(item, info);
    return info;
  }

  readonly columns: StockColumn[] = [
    {
      label: 'Название',
      field: 'name',
      valueAccessor: item => item.name ?? item.productName ?? '',
    },
    { label: 'Категория', field: 'category' },
    { label: 'Срок годности', field: 'expiryDate' },
    { label: 'Цена за единицу', field: 'unitPrice' },
    { label: 'Стоимость', field: 'totalCost' },
    { label: 'Остаток', field: 'stock' },
  ];

  private readonly columnTooltips: Record<string, string> = {
    '№ док.': 'Номер приходного документа',
    'Кол-во': 'Количество в базовой ед. изм.',
    'Срок годности': 'Дата, после которой товар списывается',
  };

  sortKey: keyof StockTableItem | null = null;
  sortDirection: SortDirection = 'asc';

  private readonly searchableFields: (keyof StockTableItem)[] = [
    'name',
    'category',
    'expiryDate',
    'unitPrice',
    'totalCost',
    'stock',
  ];

  private previousLength = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const { firstChange } = changes['data'];
      const newLength = this.data.length;
      const justAdded = !firstChange && newLength > this.previousLength;
      this.previousLength = newLength;

      this.applyFilters({
        justAdded,
        preservePage: true,
      });
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

  changeSort(field: keyof StockTableItem): void {
    if (this.sortKey === field) {
      this.sortDirection = toggleDirection(this.sortDirection);
    } else {
      this.sortKey = field;
      this.sortDirection = 'asc';
    }

    this.applyFilters({ preservePage: true });
  }

  getAriaSort(field: keyof StockTableItem): 'none' | 'ascending' | 'descending' {
    if (this.sortKey !== field) {
      return 'none';
    }

    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  formatValue(item: StockTableItem, column: StockColumn): unknown {
    return this.getColumnValue(item, column) ?? '';
  }


  getColumnTooltip(label: string): string | null {
    return this.columnTooltips[label] ?? null;

  }

  get paginatedData(): StockTableItem[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  private applyFilters(options: FilterOptions = {}): void {
    const { justAdded = false, preservePage = false } = options;
    const normalizedQuery = this.normalize(this.searchQuery);

    this.expiryInfoCache = new WeakMap();


    const nonEmptyItems = this.data.filter(item => this.hasSearchableValue(item));


    const matches = normalizedQuery
      ? nonEmptyItems.filter(item => this.matchesQuery(item, normalizedQuery))
      : nonEmptyItems;

    this.filteredData = this.sortData(matches);

    if (justAdded && !normalizedQuery) {
      this.currentPage = this.totalPages;
      return;
    }

    if (preservePage) {
      this.currentPage = Math.min(this.currentPage, this.totalPages);
      return;
    }

    this.currentPage = 1;
  }

  private matchesQuery(item: StockTableItem, query: string): boolean {
    return this.searchableFields.some(field =>

      this.normalize(this.readField(item, field)).includes(query)

    );
  }

  private normalize(value: unknown): string {
    return value === null || value === undefined
      ? ''
      : value instanceof Date
        ? value.toISOString().toLowerCase()
        : value.toString().trim().toLowerCase();
  }


  private readField(item: StockTableItem, field: keyof StockTableItem): unknown {
    const column = this.findColumn(field);

    if (column) {
      return this.getColumnValue(item, column);
    }

    return item[field];
  }

  private hasSearchableValue(item: StockTableItem): boolean {
    return this.searchableFields.some(field =>
      this.normalize(this.readField(item, field)).length > 0
    );
  }

  private sortData(items: StockTableItem[]): StockTableItem[] {
    if (!this.sortKey) {
      return [...items];
    }

    const key = this.sortKey;
    const column = this.findColumn(key);
    const selector = column?.valueAccessor
      ? (row: StockTableItem) => column.valueAccessor!(row)
      : (row: StockTableItem) => row[key];

    return sortBySelector(items, selector, this.sortDirection);
  }

  private findColumn(field: keyof StockTableItem): StockColumn | undefined {
    return this.columns.find(column => column.field === field);
  }

  private getColumnValue(item: StockTableItem, column: StockColumn): unknown {
    return column.valueAccessor ? column.valueAccessor(item) : item[column.field];
  }

  private createExpiryInfo(item: StockTableItem): ExpiryInfo {
    const date = this.toDate(item.expiryDate);

    if (!date) {
      return { date: null, status: null };
    }

    const statusCode = computeExpiryStatus(item.expiryDate ?? date, item.arrivalDate);
    return {
      date,
      status: STATUS_MAP[statusCode],
    };
  }

  private toDate(value: string | Date | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : this.startOfDay(date);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}

const STATUS_MAP: Record<'ok' | 'warning' | 'expired', ExpiryStatus> = {
  ok: { state: 'ok', label: 'OK', badgeClass: 'badge--ok' },
  warning: { state: 'warn', label: 'Скоро срок', badgeClass: 'badge--warn' },
  expired: { state: 'danger', label: 'Просрочено', badgeClass: 'badge--danger' },
};
