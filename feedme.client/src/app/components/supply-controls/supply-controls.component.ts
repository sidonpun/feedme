import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SupplyView } from '../../services/warehouse-supplies.service';

@Component({
  selector: 'app-supply-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supply-controls.component.html',
  styleUrls: ['./supply-controls.component.css']
})
export class SupplyControlsComponent {
  @Input() selectedSupply: SupplyView = 'supplies';
  @Output() selectedSupplyChange = new EventEmitter<SupplyView>();

  @Output() openPopup = new EventEmitter<void>();
  @Output() goToCatalog = new EventEmitter<void>();

  setSupplyType(type: SupplyView) {
    this.selectedSupply = type;
    this.selectedSupplyChange.emit(this.selectedSupply);
  }

  handleOpenPopup() {
    this.openPopup.emit();
  }

  handleGoToCatalog() {
    this.selectedSupply = 'catalog';
    this.selectedSupplyChange.emit(this.selectedSupply);
    this.goToCatalog.emit();
  }
}
