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
  /** Входной массив поставок */
  @Input() data: any[] = [];
  /** Эмитируем запрос на создание новой поставки */
  @Output() onAddSupply = new EventEmitter<void>();

  // фильтр и пагинация
  searchQuery = '';
  rowsPerPage = 10;
  currentPage = 1;
  filteredData: any[] = [];

  /** Храним прошлую длину, чтобы понять, добавили ли новый элемент */
  private prevLength = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const newLength = this.data.length;
      const added = newLength > this.prevLength;
      this.prevLength = newLength;
      this.applyFilters(added);
    }
  }

  /** Фильтрует, убирает пустые записи и переключает страницу */
  private applyFilters(justAdded: boolean): void {
    // 1) убираем полностью пустые
    const nonEmpty = this.data.filter(item =>
      !!(item.productName?.toString().trim()) ||
      !!(item.category?.toString().trim()) ||
      !!(item.supplier?.toString().trim())
    );

    // 2) поиск
    const q = this.searchQuery.toLowerCase();
    this.filteredData = nonEmpty.filter(item =>
      (item.productName || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.supplier || '').toLowerCase().includes(q)
    );

    // 3) если добавили новую запись и поиск не используется — ставим последнюю страницу
    if (justAdded && !q) {
      this.currentPage = this.totalPages;
    } else {
      this.currentPage = 1;
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters(false);
  }

  onRowsChange(rows: number): void {
    this.rowsPerPage = rows;
    this.applyFilters(false);
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
}
