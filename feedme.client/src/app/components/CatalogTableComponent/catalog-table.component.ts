import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableControlsComponent } from '../table-controls/table-controls.component';

@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableControlsComponent],
  templateUrl: './catalog-table.component.html',
  styleUrls: ['./catalog-table.component.css']
})
export class CatalogTableComponent implements OnChanges {
  /** Данные каталога */
  @Input() data: any[] = [];

  searchQuery: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.applyFilters();
    }
  }

  /** Убираем пустые записи и применяем поиск, сбрасываем страницу */
  private applyFilters(): void {
    const nonEmpty = this.data.filter(item =>
      !!(item.id?.toString().trim()) ||
      !!(item.name?.toString().trim()) ||
      !!(item.category?.toString().trim()) ||
      !!(item.warehouse?.toString().trim())
    );

    const q = this.searchQuery.toLowerCase();
    this.filteredData = nonEmpty.filter(item =>
      (item.id?.toString().toLowerCase().includes(q)) ||
      (item.name?.toLowerCase().includes(q)) ||
      (item.category?.toLowerCase().includes(q)) ||
      (item.warehouse?.toLowerCase().includes(q))
    );

    this.currentPage = 1;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onRowsChange(rows: number): void {
    this.rowsPerPage = rows;
    this.currentPage = 1;
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
}
