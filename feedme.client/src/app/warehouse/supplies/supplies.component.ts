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
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import { CatalogService } from '../catalog/catalog.service';
import { SuppliesService } from './supplies.service';
import { Product, SupplyRow } from '../shared/models';

interface SupplyFormValue {
  docNo: string;
  arrivalDate: string;
  warehouse: string;
  responsible: string;
  productId: string;
  qty: number | null;
  expiryDate: string;
}

@Component({
  standalone: true,
  selector: 'app-warehouse-supplies',
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule],
  templateUrl: './supplies.component.html',
  styleUrls: ['./supplies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliesComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly suppliesService = inject(SuppliesService);
  private readonly catalogService = inject(CatalogService);

  readonly tabs: ReadonlyArray<{ key: 'details' | 'product'; label: string }> = [
    { key: 'details', label: 'Детали документа' },
    { key: 'product', label: 'Товар' },
  ];

  readonly dialogOpen = signal(false);
  readonly submitting = signal(false);
  readonly activeTab = signal<'details' | 'product'>('details');

  private readonly defaults: SupplyFormValue = {
    docNo: '',
    arrivalDate: '',
    warehouse: '',
    responsible: '',
    productId: '',
    qty: null,
    expiryDate: '',
  };

  readonly supplyForm = this.fb.group({
    docNo: this.fb.control(this.defaults.docNo, {
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    arrivalDate: this.fb.control(this.defaults.arrivalDate, {
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    warehouse: this.fb.control(this.defaults.warehouse, {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    responsible: this.fb.control(this.defaults.responsible, {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    productId: this.fb.control(this.defaults.productId, {
      validators: [Validators.required],
    }),
    qty: this.fb.control<number | null>(this.defaults.qty, {
      validators: [Validators.required, Validators.min(0.0000001)],
    }),
    expiryDate: this.fb.control(this.defaults.expiryDate, {
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
  });

  readonly products = toSignal(this.catalogService.getAll(), {
    initialValue: [] as Product[],
  });

  readonly supplies = toSignal(this.suppliesService.getAll(), {
    initialValue: [] as SupplyRow[],
  });

  private readonly selectedProductId = toSignal(
    this.supplyForm.controls.productId.valueChanges,
    { initialValue: this.supplyForm.controls.productId.value },
  );

  readonly selectedProduct = computed(() => {
    const id = this.selectedProductId();
    if (!id) {
      return null;
    }
    return this.products().find((product) => product.id === id) ?? null;
  });

  readonly selectedSupplier = computed(() => this.selectedProduct()?.supplierMain ?? '—');
  readonly selectedUnit = computed(() => this.selectedProduct()?.unit ?? '—');
  readonly selectedSku = computed(() => this.selectedProduct()?.sku ?? '—');

  openDialog(): void {
    this.dialogOpen.set(true);
    this.activeTab.set('details');
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.resetForm();
  }

  setActiveTab(tab: 'details' | 'product'): void {
    this.activeTab.set(tab);
  }

  async submit(): Promise<void> {
    if (this.supplyForm.invalid) {
      this.supplyForm.markAllAsTouched();
      return;
    }

    const raw = this.supplyForm.getRawValue();
    const product = this.products().find((item) => item.id === raw.productId);
    if (!product) {
      this.supplyForm.controls.productId.setErrors({ required: true });
      this.activeTab.set('product');
      return;
    }

    if (!raw.qty || raw.qty <= 0) {
      this.supplyForm.controls.qty.setErrors({ min: true });
      this.activeTab.set('product');
      return;
    }

    if (!this.isValidISODate(raw.expiryDate)) {
      this.supplyForm.controls.expiryDate.setErrors({ pattern: true });
      this.activeTab.set('product');
      return;
    }

    const payload: SupplyRow = {
      id: '',
      docNo: raw.docNo.trim(),
      arrivalDate: raw.arrivalDate,
      warehouse: raw.warehouse.trim(),
      responsible: raw.responsible.trim() || undefined,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty: raw.qty,
      unit: product.unit,
      expiryDate: raw.expiryDate,
      supplier: product.supplierMain,
      status: 'ok',
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.suppliesService.add(payload));
      this.closeDialog();
    } finally {
      this.submitting.set(false);
    }
  }

  trackBySupplyId(_: number, row: SupplyRow): string {
    return row.id;
  }

  trackByProductId(_: number, product: Product): string {
    return product.id;
  }

  badgeClass(status: SupplyRow['status']): string {
    switch (status) {
      case 'warning':
        return 'status-badge status-badge--warning';
      case 'expired':
        return 'status-badge status-badge--expired';
      default:
        return 'status-badge status-badge--ok';
    }
  }

  private resetForm(): void {
    this.supplyForm.reset(this.defaults);
  }

  private isValidISODate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime());
  }
}
