import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WarehouseService } from '../../services/warehouse.service';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-product.component.html',
  styleUrls: ['./new-product.component.css']
})
export class NewProductComponent {
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  /** Форма добавления товара на склад */
  readonly form = this.fb.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    category: this.fb.nonNullable.control('', Validators.required),
    stock: this.fb.nonNullable.control('', Validators.required),
    unitPrice: this.fb.nonNullable.control('', Validators.required),
    expiryDate: this.fb.nonNullable.control('', Validators.required),
    responsible: this.fb.nonNullable.control(''),
    supplier: this.fb.nonNullable.control('')
  });

  /** Категории для выбора */
  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  /** Текущий выбранный товар каталога */
  selectedProduct: any | null = null;

  /** Поток подсказок по названию */
  readonly suggestions$: Observable<any[]>;

  constructor(private fb: FormBuilder, private warehouseService: WarehouseService) {
    const catalog = this.warehouseService.getCatalog();
    const nameControl = this.form.get('productName');
    this.suggestions$ = (nameControl ? nameControl.valueChanges : of('')).pipe(
      startWith(''),
      map(value => this.filterCatalog(value || '', catalog))
    );
  }

  private filterCatalog(value: string, catalog: any[]): any[] {
    const query = value.trim().toLowerCase();
    if (!query) {
      this.selectedProduct = null;
      this.form.get('category')!.setValue('');
      return [];
    }
    const matches = catalog.filter(item =>
      item.name.toLowerCase().includes(query)
    );
    const exact = matches.find(item => item.name.toLowerCase() === query);
    if (exact) {
      this.selectSuggestion(exact);
      return [];
    }
    this.selectedProduct = null;
    this.form.get('category')!.setValue('');
    return matches;
  }

  selectSuggestion(item: any): void {
    this.selectedProduct = item;
    this.form.patchValue({
      productName: item.name,
      category: item.category
    });
  }

  handleSubmit(): void {
    if (!this.selectedProduct || this.form.invalid) {
      return;
    }
    const data = {
      catalogItem: this.selectedProduct,
      ...this.form.getRawValue()
    };
    this.onSubmit.emit(data);
    this.form.reset();
    this.selectedProduct = null;
  }

  cancel(): void {
    this.onCancel.emit();
  }
}
