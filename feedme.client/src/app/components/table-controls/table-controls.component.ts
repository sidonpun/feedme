import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-controls.component.html',
  styleUrls: ['./table-controls.component.css']
})
export class TableControlsComponent {
  @Input() searchQuery: string = '';
  @Input() rowsPerPage: number = 10;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() rowsPerPageChange = new EventEmitter<number>();

  rowsOptions = [10, 20, 50, 100];

  onRowsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.rowsPerPage = parseInt(target.value, 10);
    this.rowsPerPageChange.emit(this.rowsPerPage);
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchQueryChange.emit(this.searchQuery);
  }
}
