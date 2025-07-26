import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';

export interface NewProductFormValues {
  productName: string;
  category: string;
  unitMeasure: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  supplyDate: string;
  totalCost: number;
  expiryDate: string;
  responsible: string;
  supplier: string;
  spoilsAfterOpen: boolean;
}

export type NewProductForm = {
  [K in keyof NewProductFormValues]: FormControl<NewProductFormValues[K]>;
};

@Component({
  selector: 'app-catalog-new-product-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-new-product-popup.component.html',
  styleUrls: ['./catalog-new-product-popup.component.css']
})
export class CatalogNewProductPopupComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<NewProductFormValues>();

  form: FormGroup<NewProductForm>;

  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      productName: this.fb.nonNullable.control('', { validators: Validators.required }),
      category: this.fb.nonNullable.control('', { validators: Validators.required }),
      unitMeasure: this.fb.nonNullable.control(''),
      barcode: this.fb.nonNullable.control(''),
      quantity: this.fb.nonNullable.control(0),
      unitPrice: this.fb.nonNullable.control(0),
      supplyDate: this.fb.nonNullable.control(''),
      totalCost: this.fb.nonNullable.control(0),
      expiryDate: this.fb.nonNullable.control(''),
      responsible: this.fb.nonNullable.control(''),
      supplier: this.fb.nonNullable.control(''),
      spoilsAfterOpen: this.fb.nonNullable.control(false)
    });
  }

  save(): void {
    if (this.form.valid) {
      this.submitForm.emit(this.form.getRawValue());
    }
  }

  close(): void {
    this.cancel.emit();
  }
}
