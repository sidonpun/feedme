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
 
  name: string;
  type: string;
  code: string;
  category: string;
 
  unit: string;
  weight: number;
  writeoffMethod: string;
  allergens: string;
  packagingRequired: boolean;
  spoilsAfterOpening: boolean;

  supplier: string;
  deliveryTime: number;
  costEstimate: number;
  taxRate: string;
  unitPrice: number;

  salePrice: number;
  tnved: string;
  isMarked: boolean;

  isAlcohol: boolean;
  alcoholCode: string;
  alcoholStrength: number;
  alcoholVolume: number;
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

  form: FormGroup<NewProductForm>;

  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];
  readonly types = ['Товар', 'Заготовка', 'Упаковка'];
  readonly taxRates = ['Без НДС', '10%', '20%'];
  readonly units = ['кг', 'л', 'шт', 'упаковка'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group({
     
      name: this.fb.nonNullable.control('', Validators.required),
      type: this.fb.nonNullable.control(this.types[0], Validators.required),
      code: this.fb.nonNullable.control('', Validators.required),
      category: this.fb.nonNullable.control('', Validators.required),
      unit: this.fb.nonNullable.control(this.units[0], Validators.required),
      weight: this.fb.nonNullable.control(0, Validators.required),
      writeoffMethod: this.fb.nonNullable.control('FIFO'),
      allergens: this.fb.nonNullable.control(''),
      packagingRequired: this.fb.nonNullable.control(false),
      spoilsAfterOpening: this.fb.nonNullable.control(false),

      supplier: this.fb.nonNullable.control(''),
      deliveryTime: this.fb.nonNullable.control(0),
      costEstimate: this.fb.nonNullable.control(0),
      taxRate: this.fb.nonNullable.control(this.taxRates[0], Validators.required),
      unitPrice: this.fb.nonNullable.control(0, Validators.required),
      salePrice: this.fb.nonNullable.control(0),
      tnved: this.fb.nonNullable.control(''),
      isMarked: this.fb.nonNullable.control(false),

      isAlcohol: this.fb.nonNullable.control(false),
      alcoholCode: this.fb.nonNullable.control(''),
      alcoholStrength: this.fb.nonNullable.control(0),
      alcoholVolume: this.fb.nonNullable.control(0),
    }) as FormGroup<NewProductForm>;

    this.form.get('isAlcohol')!.valueChanges.subscribe((val) => {
      const alcoholControls = [
        'alcoholCode',
        'alcoholStrength',
        'alcoholVolume',
      ] as const;
      alcoholControls.forEach((c) => {
        const control = this.form.get(c);
        if (!control) return;
        if (val) {
          control.addValidators(Validators.required);
        } else {
          control.clearValidators();
          control.setValue(typeof control.value === 'number' ? 0 : '');
        }
        control.updateValueAndValidity();
      });
    });
  }
  onSubmit(): void {
    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }
    this.save.emit(this.form.getRawValue());
  }

  close(): void {
    this.cancel.emit();
  }
}
