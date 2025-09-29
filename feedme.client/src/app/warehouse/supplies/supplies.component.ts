
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, take, tap } from 'rxjs';

import { SupplyProduct, SupplyRow, SupplyStatus } from '../shared/models';
import { computeExpiryStatus } from '../shared/status.util';
import { SuppliesService } from './supplies.service';

type SupplyFormValue = {

  docNo: string;
  arrivalDate: string;
  warehouse: string;
  responsible: string;
  productId: string;

  qty: number;
  expiryDate: string;
};

type QuickPeriod = 'today' | '7d' | '30d';

type Period = QuickPeriod | '';

interface QuickPeriodOption {
  readonly id: QuickPeriod;
  readonly label: string;
  readonly days: number;
}

@Component({
  standalone: true,
  selector: 'app-supplies',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './supplies.component.html',
  styleUrl: './supplies.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliesComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly suppliesService = inject(SuppliesService);


  readonly rowsReady = signal(false);

  readonly rows = toSignal(
    this.suppliesService.getAll().pipe(tap(() => this.rowsReady.set(true))),
    { initialValue: [] as SupplyRow[] },
  );

  readonly supplyKpis = computed(() => {
    const rows = this.rows();

    let warning = 0;
    let expired = 0;

    for (const row of rows) {
      if (row.status === 'warning') {
        warning += 1;
      } else if (row.status === 'expired') {
        expired += 1;
      }
    }

    const ok = rows.length - warning - expired;

    return {
      total: rows.length,
      ok: ok < 0 ? 0 : ok,
      warning,
      expired,
    } as const;
  });
  readonly products$ = this.suppliesService.getProducts();

  private readonly rowsSignal = toSignal(this.rows$, { initialValue: [] as SupplyRow[] });
  private readonly productsSignal = toSignal(this.products$, { initialValue: [] as SupplyProduct[] });

  readonly dialogOpen = signal(false);


  readonly form = this.fb.group({
    docNo: this.fb.control('', { validators: [Validators.required] }),
    arrivalDate: this.fb.control('', { validators: [Validators.required] }),
    warehouse: this.fb.control('', { validators: [Validators.required] }),
    responsible: this.fb.control(''),
    productId: this.fb.control('', { validators: [Validators.required] }),
    qty: this.fb.control(0, { validators: [Validators.required, Validators.min(0.0001)] }),
    expiryDate: this.fb.control('', { validators: [Validators.required] }),
  });

  private readonly selectedProductId = toSignal(
    this.form.controls.productId.valueChanges.pipe(startWith(this.form.controls.productId.value)),
    { initialValue: this.form.controls.productId.value },
  );

  readonly selectedProduct = computed<SupplyProduct | null>(() => {

    const id = this.selectedProductId();
    if (!id) {
      return null;
    }

    return this.suppliesService.getProductById(id) ?? null;
  });

  readonly kpi = computed((): { weekSupplies: number; weekSpend: number; items: number; expired: number } => {
    const rows = this.rowsSignal();
    const products = this.productsSignal();

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    endOfToday.setMilliseconds(endOfToday.getMilliseconds() - 1);

    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const priceByProduct = new Map<string, number>();
    for (const product of products) {
      priceByProduct.set(product.id, product.purchasePrice ?? 0);
    }

    let weekSupplies = 0;
    let weekSpend = 0;
    let expired = 0;
    const uniqueProductIds = new Set<string>();

    for (const row of rows) {
      uniqueProductIds.add(row.productId);

      if (row.status === 'expired') {
        expired += 1;
      }

      const arrival = this.parseIsoDate(row.arrivalDate);
      if (!Number.isNaN(arrival.getTime()) && arrival >= weekStart && arrival <= endOfToday) {
        weekSupplies += 1;
        const price = priceByProduct.get(row.productId) ?? 0;
        weekSpend += price * row.qty;
      }
    }

    const normalizedWeekSpend = Math.round(weekSpend * 100) / 100;

    return {
      weekSupplies,
      weekSpend: normalizedWeekSpend,
      items: uniqueProductIds.size,
      expired,
    };
  });

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.resetForm();
  }


  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as SupplyFormValue;
    const product = this.suppliesService.getProductById(value.productId);

    if (!product) {
      this.form.controls.productId.setErrors({ missingProduct: true });
      return;
    }

    const docNo = value.docNo.trim();
    const warehouse = value.warehouse.trim();
    const responsible = value.responsible.trim();
    const qty = Number(value.qty);

    if (!docNo) {
      this.form.controls.docNo.setErrors({ required: true });
      this.form.controls.docNo.markAsTouched();
      return;
    }

    if (!warehouse) {
      this.form.controls.warehouse.setErrors({ required: true });
      this.form.controls.warehouse.markAsTouched();
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      this.form.controls.qty.setErrors({ min: true });
      this.form.controls.qty.markAsTouched();
      return;
    }

    const payload: Omit<SupplyRow, 'id'> = {
      docNo,
      arrivalDate: value.arrivalDate,
      warehouse,
      responsible: responsible ? responsible : undefined,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty,
      unit: product.unit,
      expiryDate: value.expiryDate,
      supplier: product.supplier,
      status: computeExpiryStatus(value.expiryDate, value.arrivalDate),
    };

    this.suppliesService
      .add(payload)
      .pipe(take(1))
      .subscribe(() => {
        this.closeDialog();
      });
  }

  trackBySupplyId(_: number, row: SupplyRow): string {
    return row.id;
  }

  statusClass(status: SupplyStatus): Record<string, boolean> {
    return {
      'status-pill': true,
      'status-ok': status === 'ok',
      'status-warn': status === 'warning',
      'status-expired': status === 'expired',
    };
  }

  statusText(status: SupplyStatus): string {
    if (status === 'ok') {
      return 'Ок';
    }

    if (status === 'warning') {
      return 'Скоро срок';
    }

    return 'Просрочено';
  }

  private parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return new Date(NaN);
    }

    return new Date(year, month - 1, day);
  }

  private resetForm(): void {
    this.form.reset({
      docNo: '',
      arrivalDate: '',
      warehouse: '',
      responsible: '',
      productId: '',
      qty: 0,
      expiryDate: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();

  }

  private createToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private formatDate(date: Date): string {
    const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return normalized.toISOString().slice(0, 10);
  }
}
