import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.css']
})
export class TableControlsComponent {
  @Input() searchQuery: string = '';
  @Input() rowsPerPage: number = 10;
  @Input() showRowsSelector = true;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() rowsPerPageChange = new EventEmitter<number>();

  rowsOptions: number[] = [10, 20, 50, 100];

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchQueryChange.emit(this.searchQuery);
  }

  onRowsPerPageChange(value: string) {
    this.rowsPerPage = parseInt(value, 10);
    this.rowsPerPageChange.emit(this.rowsPerPage);
  }
}
