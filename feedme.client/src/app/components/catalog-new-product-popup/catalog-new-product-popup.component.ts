import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NewProductFormValues {
  productName: string;
  category: string;
  taxRate: string;
  unit: string;
  unitPrice: number;
  description: string;
  requiresPackaging: boolean;
  perishableAfterOpening: boolean;
}



@Component({
  selector: 'app-catalog-new-product-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog-new-product-popup.component.html',
  styleUrls: ['./catalog-new-product-popup.component.css']
})
export class CatalogNewProductPopupComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewProductFormValues>();
  @Output() submitForm = new EventEmitter<NewProductFormValues>();

  form: FormGroup<NewProductForm>;

  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  readonly taxRates = ['Без НДС', '10%', '20%'];
  readonly units = ['кг', 'л', 'шт', 'упаковка'];

  submit(): void {
    const data: NewProductFormValues = {
      productName: this.productName,
      category: this.category,
      taxRate: this.taxRate,
      unit: this.unit,
      unitPrice: Number(this.unitPrice),
      description: this.description,
      requiresPackaging: this.requiresPackaging,
      perishableAfterOpening: this.perishableAfterOpening
    };
    this.save.emit(data);
    this.submitForm.emit(data);
  }

  close(): void {
    this.cancel.emit();
  }
}
