import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-product.component.html',
  styleUrls: ['./new-product.component.css']
})
export class NewProductComponent {
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  productName = '';
  category = '';
  stock: number | null = null;
  unitPrice: number | null = null;
  expiryDate = '';
  responsible = '';
  supplier = '';

  categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  // Логика отправки формы — не удаляем
  handleSubmit() {
    if (this.stock === null || this.unitPrice === null) {
      return;
    }

    const formData = {
      productName: this.productName,
      category: this.category,
      stock: this.stock,
      unitPrice: this.unitPrice,
      expiryDate: this.expiryDate,
      responsible: this.responsible,
      supplier: this.supplier
    };

    this.onSubmit.emit(formData);
    this.resetForm();
  }

  // Сброс полей формы
  resetForm() {
    this.productName = '';
    this.category = '';
    this.stock = null;
    this.unitPrice = null;
    this.expiryDate = '';
    this.responsible = '';
    this.supplier = '';
  }

  // Метод отмены (закрытие формы)
  cancel() {
    this.onCancel.emit();
  }
}
