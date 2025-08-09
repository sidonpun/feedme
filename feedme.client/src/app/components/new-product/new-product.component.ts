import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';
import { CatalogItem, CatalogService } from '../../services/catalog.service';

/** Значения формы добавления поставки */
interface SupplyFormValues {
  productName: string;
  stock: string;
  expiryDate: string;
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

  @Output() onSubmit = new EventEmitter<SupplyFormValues & {
    catalogItem: CatalogItem;
    category: string;
    unitPrice: number;
    supplier: string;
    responsible: string;
  }>();

  @Input() warehouse!: string;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService
  ) {}

  /** Форма добавления поставки */
  readonly form = this.fb.group({
    productName: this.fb.nonNullable.control('', Validators.required),
    stock: this.fb.nonNullable.control('', Validators.required),
    expiryDate: this.fb.nonNullable.control('', Validators.required)
  });

  /** Текущий выбранный товар каталога */
  selectedProduct: CatalogItem | null = null;

  /** Поток подсказок по названию */
  suggestions$: Observable<CatalogItem[]> = of([]);

  private catalog: CatalogItem[] = [];

  ngOnInit(): void {
    const nameControl = this.form.controls.productName;
    this.suggestions$ = nameControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCatalog(value || ''))
    );

    this.catalogService
      .getAll()
      .pipe(take(1))
      .subscribe(catalog => {
        this.catalog = catalog;
        nameControl.setValue(nameControl.value);
      });
  }

  private filterCatalog(value: string): CatalogItem[] {
    const query = value.trim().toLowerCase();
    if (!query) {
      this.selectedProduct = null;
      return [];
    }
    const matches = this.catalog.filter(item =>
      item.name.toLowerCase().includes(query)
    );
    const exact = matches.find(item => item.name.toLowerCase() === query);
    if (exact) {
      this.selectedProduct = exact;
      this.form.patchValue({ productName: exact.name }, { emitEvent: false });
      return [];
    }
    this.selectedProduct = null;
    return matches;
  }

  selectSuggestion(item: CatalogItem): void {
    this.selectedProduct = item;
    this.form.patchValue({ productName: item.name }, { emitEvent: false });
  }

  handleSubmit(): void {
    if (!this.selectedProduct || this.form.invalid) {
      return;
    }
    const { stock, expiryDate } = this.form.getRawValue();
    const data = {
      productName: this.selectedProduct.name,
      stock,
      expiryDate,
      category: this.selectedProduct.category,
      unitPrice: this.selectedProduct.unitPrice,
      supplier: this.selectedProduct.supplier,
      responsible: this.warehouse,
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
