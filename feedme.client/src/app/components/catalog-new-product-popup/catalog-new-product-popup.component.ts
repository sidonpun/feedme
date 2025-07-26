import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';

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
  @Output() save = new EventEmitter<NewProductFormValues>();
  @Output() submitForm = new EventEmitter<NewProductFormValues>();

  form: FormGroup<NewProductForm>;

  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  readonly taxRates = ['Без НДС', '10%', '20%'];
  readonly units = ['кг', 'л', 'шт', 'упаковка'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
      productName: this.fb.nonNullable.control('', Validators.required),
      category: this.fb.nonNullable.control('', Validators.required),
      taxRate: this.fb.nonNullable.control(this.taxRates[0]),
      unit: this.fb.nonNullable.control(this.units[0]),
      unitPrice: this.fb.nonNullable.control(0),
      description: this.fb.nonNullable.control(''),
      requiresPackaging: this.fb.nonNullable.control(false),
      perishableAfterOpening: this.fb.nonNullable.control(false),
    }) as FormGroup<NewProductForm>;
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = this.form.getRawValue();
      this.save.emit(data);
      this.submitForm.emit(data);
    }
  }

  close(): void {
    this.cancel.emit();
  }
}
