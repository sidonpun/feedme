import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-supply-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supply-controls.component.html',
  styleUrls: ['./supply-controls.component.css']
})
export class SupplyControlsComponent {
  @Input() selectedSupply: string = 'supplies';
  @Output() selectedSupplyChange = new EventEmitter<string>();

  @Output() openPopup = new EventEmitter<void>();
  @Output() goToCatalog = new EventEmitter<void>();

  setSupplyType(type: string) {
    this.selectedSupply = type;
    this.selectedSupplyChange.emit(this.selectedSupply);
  }

  handleOpenPopup() {
    this.openPopup.emit();
  }

  handleGoToCatalog() {
    this.goToCatalog.emit();
  }
}
