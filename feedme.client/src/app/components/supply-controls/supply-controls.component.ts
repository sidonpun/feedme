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
  @Output() openNewProduct = new EventEmitter<void>();  // ← новое
  @Output() addSupply = new EventEmitter<void>();
  @Output() goToCatalog = new EventEmitter<void>();

  setSupplyType(type: 'supplies' | 'stock' | 'catalog'): void {
    // если та же вкладка — ничего не делать
    if (this.selectedSupply === type) {
      return;
    }

    // установить новую вкладку
    this.selectedSupply = type;
    // уведомить родителя об изменении
    this.selectedSupplyChange.emit(this.selectedSupply);

    // при переходе на каталог можно дополнительно вызвать навигацию
    if (type === 'catalog') {
      this.goToCatalog.emit();
    }
  }
  



  handleGoToCatalog(): void {
    this.setSupplyType('catalog');
    this.goToCatalog.emit();
  }
  onAddClick() {
    this.addSupply.emit();
  }
}
