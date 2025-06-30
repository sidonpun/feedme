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
  @Input() data: any[] = [];
  @Output() onAddSupply = new EventEmitter<void>();

  searchQuery: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;
  filteredData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.filterData();
    }
  }

  filterData(): void {
    const query = this.searchQuery.toLowerCase();
    if (query) {
      this.filteredData = this.data.filter(item => {
        const name = (item.productName || item.name || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        const supplier = (item.supplier || '').toLowerCase();
        return name.includes(query) || category.includes(query) || supplier.includes(query);
      });
    } else {
      this.filteredData = [...this.data];
    }
    this.currentPage = 1;
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery = query;
    this.filterData();
  }

  onRowsPerPageChange(rows: number): void {
    this.rowsPerPage = rows;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.rowsPerPage) || 1;
  }

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.rowsPerPage);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
