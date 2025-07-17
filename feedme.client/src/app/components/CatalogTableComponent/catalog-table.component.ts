import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
  /** Входные данные для каталога */
  @Input() data: any[] = [];

  @Output() onAddSupply = new EventEmitter<void>(); 
  /** Управление фильтрацией и пагинацией */
  searchQuery: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.applyFilters();
    }
  }

  /** Убираем пустые записи и применяем поиск */
  private applyFilters(): void {
    // 1) отбрасываем полностью пустые объекты
    const nonEmpty = this.data.filter(item =>
      !!(item.id?.toString().trim()) ||
      !!(item.category?.toString().trim()) ||
      !!(item.name?.toString().trim()) ||
      !!(item.stock?.toString().trim()) ||
      !!(item.totalCost?.toString().trim()) ||
      !!(item.warehouse?.toString().trim()) ||
      !!(item.expiryDate?.toString().trim()) ||
      !!(item.supplier?.toString().trim())
    );

    // 2) поиск
    const q = this.searchQuery.toLowerCase();
    this.filteredData = nonEmpty.filter(item =>
      (item.id || '').toString().toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.warehouse || '').toLowerCase().includes(q)
    );

    // 3) сброс страницы
    this.currentPage = 1;
  }

  /** Обновление поискового запроса */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  /** Обновление количества строк на странице */
  onRowsChange(rows: number): void {
    this.rowsPerPage = rows;
    this.currentPage = 1;
  }

  /** Общее число страниц */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
  }

  /** Данные для текущей страницы */
  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  addSupply(): void { this.onAddSupply.emit() }
  /** Навигация по страницам */
  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
}
