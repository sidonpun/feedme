import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableControlsComponent } from '../table-controls/table-controls.component';

@Component({
  selector: 'app-stock-table',
  standalone: true,
  imports: [CommonModule, TableControlsComponent],
  templateUrl: './stock-table.component.html',
  styleUrls: ['./stock-table.component.css']
})
export class StockTableComponent {
  @Input() data: any[] = [];
  @Output() onSettingsClick = new EventEmitter<any>();

  searchQuery: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;

  get filteredData(): any[] {
    const q = this.searchQuery.toLowerCase();
    return this.data.filter(item =>
      item.name.toLowerCase().includes(q)
    );
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  nextPage() {
    if ((this.currentPage * this.rowsPerPage) < this.filteredData.length) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
