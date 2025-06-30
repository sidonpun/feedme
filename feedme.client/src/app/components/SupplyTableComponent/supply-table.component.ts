import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableControlsComponent } from '../table-controls/table-controls.component';

@Component({
  selector: 'app-supply-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableControlsComponent],
  templateUrl: './supply-table.component.html',
  styleUrls: ['./supply-table.component.css']
})
export class SupplyTableComponent implements OnChanges {
  /** Входящий массив данных */
  @Input() data: any[] = [];
  /** Событие открытия попапа */
  @Output() onAddSupply = new EventEmitter<void>();

  searchQuery: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;
  /** Отфильтрованные и очищенные от пустых записи */
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.applyFilters();
    }
  }

  /** Убирает полностью пустые объекты и применяет поиск */
  private applyFilters(): void {
    // 1) Убираем полностью пустые записи
    const nonEmpty = this.data.filter(item => {
      return !!(item.productName?.toString().trim()) ||
        !!(item.category?.toString().trim()) ||
        !!(item.stock?.toString().trim()) ||
        !!(item.unitPrice?.toString().trim()) ||
        !!(item.expiryDate?.toString().trim()) ||
        !!(item.responsible?.toString().trim()) ||
        !!(item.supplier?.toString().trim());
    });

    // 2) Применяем поиск по ключевым полям
    const q = this.searchQuery.toLowerCase();
    this.filteredData = nonEmpty.filter(item =>
      (item.productName || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.supplier || '').toLowerCase().includes(q)
    );

    // Сбрасываем страницу на первую
    this.currentPage = 1;
  }

  /** Обработчик изменения строки поиска */
  onSearchQueryChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  /** Обработчик изменения количества строк */
  onRowsPerPageChange(rows: number): void {
    this.rowsPerPage = rows;
    this.currentPage = 1;
  }

  /** Общее число страниц */
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.rowsPerPage) || 1;
  }

  /** Текущий срез данных для отображения */
  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  /** Навигация по страницам */
  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  /** Вызов события добавления новой поставки */
  addSupply(): void {
    this.onAddSupply.emit();
  }
}
