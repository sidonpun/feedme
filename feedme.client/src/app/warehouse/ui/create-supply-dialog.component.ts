import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

import { WarehouseCatalogService } from '../catalog/catalog.service';
import { Product } from '../shared/models';

export interface CreateSupplyDialogResult {
  readonly product: Product;
  readonly quantity: number;
  readonly arrivalDate: string;
  readonly expiryDate: string;
}

@Component({
  selector: 'app-create-supply-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-supply-dialog.component.html',
  styleUrl: './create-supply-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSupplyDialogComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() create = new EventEmitter<CreateSupplyDialogResult>();

  private readonly catalogService = inject(WarehouseCatalogService);
  private readonly fb = inject(NonNullableFormBuilder);

  private static readonly maxSuggestions = 8;

  readonly form = this.fb.group({
    productQuery: this.fb.control('', { validators: [Validators.required] }),
    productId: this.fb.control('', { validators: [Validators.required] }),
    quantity: this.fb.control(1, {
      validators: [Validators.required, Validators.min(0.001)],
    }),
    arrivalDate: this.fb.control(this.formatDate(new Date()), {
      validators: [Validators.required],
    }),
    expiryDate: this.fb.control('', { validators: [Validators.required] }),
  });

  readonly products = toSignal(this.catalogService.getAll(), {
    initialValue: [] as Product[],
  });

  private readonly productQuery = toSignal(
    this.form.controls.productQuery.valueChanges.pipe(
      startWith(this.form.controls.productQuery.value),
    ),
    { initialValue: this.form.controls.productQuery.value },
  );

  private readonly selectedProductId = toSignal(
    this.form.controls.productId.valueChanges.pipe(
      startWith(this.form.controls.productId.value),
    ),
    { initialValue: this.form.controls.productId.value },
  );

  readonly selectedProduct = computed<Product | null>(() => {
    const id = this.selectedProductId();
    if (!id) {
      return null;
    }

    return this.products().find((item) => item.id === id) ?? null;
  });

  readonly suggestions = computed(() => {
    const query = this.normalizeQuery(this.productQuery());
    if (!query) {
      return [] as Product[];
    }

    const selected = this.selectedProduct();
    const all = this.products();

    return all
      .filter((product) =>
        this.matchesQuery(product, query) &&
        (!selected || selected.id !== product.id || query !== selected.name.toLowerCase()),
      )
      .slice(0, CreateSupplyDialogComponent.maxSuggestions);
  });

  constructor() {
    this.form.controls.productQuery.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value: string) => {
        const selected = this.selectedProduct();
        if (!selected) {
          return;
        }

        const query = this.normalizeQuery(value);
        if (!query || query !== selected.name.toLowerCase()) {
          this.form.controls.productId.setValue('', { emitEvent: false });
        }
      });
  }

  selectProduct(product: Product): void {
    this.form.controls.productId.setValue(product.id);
    this.form.controls.productQuery.setValue(product.name);
  }

  submit(): void {
    this.form.markAllAsTouched();

    const selected = this.selectedProduct();
    if (!selected) {
      this.form.controls.productId.setErrors({ required: true });
      return;
    }

    const arrival = this.form.controls.arrivalDate.value;
    const expiry = this.form.controls.expiryDate.value;

    if (arrival && expiry && arrival > expiry) {
      this.form.controls.expiryDate.setErrors({ dateOrder: true });
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const quantity = Number(this.form.controls.quantity.value);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.form.controls.quantity.setErrors({ min: true });
      return;
    }

    this.create.emit({
      product: selected,
      quantity,
      arrivalDate: arrival!,
      expiryDate: expiry!,
    });
  }

  close(): void {
    this.cancel.emit();
  }

  trackByProduct = (_: number, product: Product) => product.id;

  private normalizeQuery(value: string | null): string {
    return (value ?? '').trim().toLowerCase();
  }

  private matchesQuery(product: Product, query: string): boolean {
    if (!query) {
      return false;
    }

    const haystack = `${product.name} ${product.sku} ${product.category}`.toLowerCase();
    return query
      .split(/\s+/)
      .filter(Boolean)
      .every((token) => haystack.includes(token));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
