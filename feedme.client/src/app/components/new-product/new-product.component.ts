import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CatalogService, CatalogItem } from '../../services/catalog.service';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface FormValues {
  productName: string;
  category: string;
  stock: string;
  unitPrice: string;
  expiryDate: string;
  responsible: string;
  supplier: string;
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
  @Output() onSubmit = new EventEmitter<FormValues & { catalogItem: CatalogItem }>();


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
  selectedProduct: CatalogItem | null = null;

  /** Поток подсказок по названию */

  suggestions$!: Observable<CatalogItem[]>;

  private catalog: CatalogItem[] = [];

  constructor(private fb: FormBuilder, private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.catalogService.getAll().subscribe(catalog => {
      this.catalog = catalog;
      const nameControl = this.form.get('productName');
      this.suggestions$ = (nameControl ? nameControl.valueChanges : of('')).pipe(
        startWith(''),
        map(value => this.filterCatalog(value || ''))
      );
    });
  }

  private filterCatalog(value: string): CatalogItem[] {
    const query = value.trim().toLowerCase();
    if (!query) {
      this.selectedProduct = null;
      this.form.get('category')!.setValue('');
      return [];
    }
    const matches = this.catalog.filter(item =>
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


  selectSuggestion(item: CatalogItem): void {
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
