import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { WarehouseCatalogService } from './catalog.service';
import { Product } from '../shared/models';

interface ProductFormValue {
  name: string;
  type: Product['type'];
  sku: string;
  category: string;
  unit: Product['unit'];
  unitWeight: number | null;
  writeoff: Product['writeoff'];
  allergens: string;
  needsPacking: boolean;
  perishableAfterOpen: boolean;
  supplierMain: string;
  leadTimeDays: number | null;
  costEst: number | null;
  vat: string;
  purchasePrice: number | null;
  salePrice: number | null;
  tnvCode: string;
  marked: boolean;
  alcohol: boolean;
}

@Component({
  standalone: true,
  selector: 'app-warehouse-catalog',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalogService = inject(WarehouseCatalogService);

  private readonly defaults: ProductFormValue = {
    name: '',
    type: 'Товар',
    sku: '',
    category: '',
    unit: 'кг',
    unitWeight: null,
    writeoff: 'FIFO',
    allergens: '',
    needsPacking: false,
    perishableAfterOpen: false,
    supplierMain: '',
    leadTimeDays: null,
    costEst: null,
    vat: '',
    purchasePrice: null,
    salePrice: null,
    tnvCode: '',
    marked: false,
    alcohol: false,
  };

  readonly dialogOpen = signal(false);
  readonly submitting = signal(false);

  readonly productForm = this.fb.group({
    name: this.fb.control(this.defaults.name, {
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    type: this.fb.control<Product['type']>(this.defaults.type, {
      validators: [Validators.required],
    }),
    sku: this.fb.control(this.defaults.sku, {
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    category: this.fb.control(this.defaults.category, {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    unit: this.fb.control<Product['unit']>(this.defaults.unit, {
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    unitWeight: this.fb.control<number | null>(this.defaults.unitWeight, {
      validators: [Validators.min(0)],
    }),
    writeoff: this.fb.control<Product['writeoff']>(this.defaults.writeoff),
    allergens: this.fb.control(this.defaults.allergens),
    needsPacking: this.fb.control(this.defaults.needsPacking),
    perishableAfterOpen: this.fb.control(this.defaults.perishableAfterOpen),
    supplierMain: this.fb.control(this.defaults.supplierMain),
    leadTimeDays: this.fb.control<number | null>(this.defaults.leadTimeDays, {
      validators: [Validators.min(0)],
    }),
    costEst: this.fb.control<number | null>(this.defaults.costEst, {
      validators: [Validators.min(0)],
    }),
    vat: this.fb.control(this.defaults.vat),
    purchasePrice: this.fb.control<number | null>(this.defaults.purchasePrice, {
      validators: [Validators.min(0)],
    }),
    salePrice: this.fb.control<number | null>(this.defaults.salePrice, {
      validators: [Validators.min(0)],
    }),
    tnvCode: this.fb.control(this.defaults.tnvCode),
    marked: this.fb.control(this.defaults.marked),
    alcohol: this.fb.control(this.defaults.alcohol),
  });

  readonly products = toSignal(this.catalogService.getAll(), {
    initialValue: [] as Product[],
  });

  readonly productsCount = computed(() => this.products().length);

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.resetForm();
  }

  openNewProductPopup(): void {
    this.openDialog();
  }

  closeNewProductPopup(): void {
    this.closeDialog();
  }

  async submit(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const raw = this.productForm.getRawValue();
    const payload: Product = {
      id: '',
      name: raw.name.trim(),
      type: raw.type,
      sku: raw.sku.trim(),
      category: raw.category.trim(),
      unit: raw.unit,
      unitWeight: this.normalizeNumber(raw.unitWeight),
      writeoff: raw.writeoff,
      allergens: raw.allergens.trim() || null,
      needsPacking: raw.needsPacking,
      perishableAfterOpen: raw.perishableAfterOpen,
      supplierMain: raw.supplierMain.trim() || null,
      leadTimeDays: this.normalizeNumber(raw.leadTimeDays),
      costEst: this.normalizeNumber(raw.costEst),
      vat: raw.vat.trim() || null,
      purchasePrice: this.normalizeNumber(raw.purchasePrice),
      salePrice: this.normalizeNumber(raw.salePrice),
      tnvCode: raw.tnvCode.trim() || null,
      marked: raw.marked,
      alcohol: raw.alcohol,
      alcoholCode: null,
      alcoholStrength: null,
      alcoholVolume: null,
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.catalogService.add(payload));
      this.closeDialog();
    } finally {
      this.submitting.set(false);
    }
  }

  trackByProductId(_: number, product: Product): string {
    return product.id;
  }

  private resetForm(): void {
    this.productForm.reset(this.defaults);
  }

  private normalizeNumber(value: number | null): number | null {
    if (value === null || Number.isNaN(value)) {
      return null;
    }

    if (value < 0) {
      return null;
    }

    return value;
  }
}
