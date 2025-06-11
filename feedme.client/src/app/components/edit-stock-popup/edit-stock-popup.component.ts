import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-stock-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-stock-popup.component.html',
  styleUrls: ['./edit-stock-popup.component.css']
})
export class EditStockPopupComponent implements OnChanges {
  @Input() initialStock: number | string = '';
  @Output() onSave = new EventEmitter<number>();
  @Output() onClose = new EventEmitter<void>();

  stock: number | string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialStock']) {
      this.stock = changes['initialStock'].currentValue;
    }
  }

  handleSave() {
    const parsedStock = parseFloat(this.stock as string);
    if (!isNaN(parsedStock)) {
      this.onSave.emit(parsedStock);
    } else {
      alert('Введите корректное числовое значение.');
    }
  }

  handleClose() {
    this.onClose.emit();
  }
}
