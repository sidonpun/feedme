import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableControlsComponent } from '../table-controls/table-controls.component';

@Component({
  selector: 'app-supply-table',
  standalone: true,
  imports: [CommonModule, TableControlsComponent],
  templateUrl: './supply-table.component.html',
  styleUrls: ['./supply-table.component.css']
})
export class SupplyTableComponent {
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
