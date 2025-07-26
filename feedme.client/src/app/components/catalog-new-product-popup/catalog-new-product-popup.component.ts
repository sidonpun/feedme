import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';

export interface NewProductForm {
  productName: string;
  category: string;
  unitMeasure: string;
  barcode: string;
  unitPrice: number;
  vatRate: string;
  quantity: number;
  minimumStock: number;
  warehouse: string;
  supplier: string;
  expiryDate: string;
  description: string;
  requiresPackaging: boolean;
  spoilsAfterOpen: boolean;
}

@Component({
  selector: 'app-catalog-new-product-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-new-product-popup.component.html',
  styleUrls: ['./catalog-new-product-popup.component.css']
})
export class CatalogNewProductPopupComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewProductForm>();

  form: FormGroup<NewProductForm>;

  categories = ['Готовое блюдо', 'Заготовка', 'Товар', 'Добавка'];
  units = ['шт', 'кг', 'л', 'уп'];
  vatRates = ['0%', '10%', '20%'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      unitMeasure: ['', Validators.required],
      barcode: '',
      unitPrice: 0,
      vatRate: '0%',
      quantity: 0,
      minimumStock: 0,
      warehouse: '',
      supplier: '',
      expiryDate: '',
      description: '',
      requiresPackaging: false,
      spoilsAfterOpen: false
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.getRawValue());
    }
  }
}
