import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableControlsComponent } from '../table-controls/table-controls.component';

interface StockTableItem {
  name?: string;
  category?: string;
  expiryDate?: string | Date;
  unitPrice?: string | number;
  totalCost?: string | number;
  stock?: string | number;
}

interface FilterOptions {
  justAdded?: boolean;
  preservePage?: boolean;
}

@Component({
  selector: 'app-stock-table',
  standalone: true,
  imports: [CommonModule, TableControlsComponent],
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

    const nonEmptyItems = this.data.filter(item =>
      this.searchableFields.some(field => this.normalize(item[field]).length > 0)
    );

    const matches = normalizedQuery
      ? nonEmptyItems.filter(item => this.matchesQuery(item, normalizedQuery))
      : nonEmptyItems;

    this.filteredData = matches;

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
      this.normalize(item[field]).includes(query)
    );
  }

  private normalize(value: unknown): string {
    return value === null || value === undefined
      ? ''
      : value instanceof Date
        ? value.toISOString().toLowerCase()
        : value.toString().trim().toLowerCase();
  }
}
