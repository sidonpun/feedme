import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { WarehouseService } from '../../services/warehouse.service';

interface CatalogItem {
  name: string;
  category: string;
  unitPrice: number;
  supplier?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-product.component.html',
  styleUrls: ['./new-product.component.css']
})
export class NewProductComponent implements OnInit {
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  /** Форма добавления товара на склад */
  readonly form = this.fb.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    category: this.fb.nonNullable.control('', Validators.required),
    stock: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    unitPrice: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    expiryDate: this.fb.nonNullable.control('', Validators.required),
    responsible: this.fb.nonNullable.control(''),
    supplier: this.fb.nonNullable.control('')
  });

  /** Категории для выбора */
  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  /** Все товары каталога */
  private catalog: CatalogItem[] = [];

  /** Текущий выбранный товар каталога */
  selectedProduct: CatalogItem | null = null;

  /** Поток подсказок по названию */
  suggestions$!: Observable<CatalogItem[]>;

  constructor(private fb: FormBuilder, private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.catalog = this.warehouseService.getCatalog();
    const nameControl = this.form.get('productName')!;
    this.suggestions$ = nameControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCatalog(value || ''))
    );
  }

  private filterCatalog(value: string): CatalogItem[] {
    const query = value.trim().toLowerCase();
    this.selectedProduct = null;
    this.form.get('category')!.setValue('');
    if (!query) {
      return [];
    }
    return this.catalog.filter(item =>
      item.name.toLowerCase().includes(query)
    );
  }

  selectSuggestion(item: CatalogItem): void {
    this.selectedProduct = item;
    this.form.patchValue({
      productName: item.name,
      category: item.category,
      unitPrice: item.unitPrice,
      supplier: item.supplier ?? ''
    });
  }

  handleSubmit(): void {
    if (!this.selectedProduct || this.form.invalid) {
      return;
    }
    const { stock, unitPrice, expiryDate, responsible, supplier } = this.form.getRawValue();
    const data = {
      name: this.selectedProduct.name,
      category: this.selectedProduct.category,
      stock,
      unitPrice,
      expiryDate,
      responsible,
      supplier,
      totalCost: stock * unitPrice,
      catalogItem: this.selectedProduct
    };
    this.onSubmit.emit(data);
    this.form.reset();
    this.selectedProduct = null;
  }

  cancel(): void {
    this.onCancel.emit();
  }
}
