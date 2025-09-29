
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, take } from 'rxjs';

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

@Component({
  standalone: true,
  selector: 'app-supplies',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplies.component.html',
  styleUrl: './supplies.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliesComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly suppliesService = inject(SuppliesService);


  readonly rows$ = this.suppliesService.getAll();
  readonly products$ = this.suppliesService.getProducts();

  readonly dialogOpen = signal(false);

  private readonly statusLabels: Record<SupplyStatus, string> = {
    ok: 'Ок',
    warning: 'Скоро срок',
    expired: 'Просрочено',
  };

  private readonly statusClasses: Record<SupplyStatus, string> = {
    ok: 'supplies-status supplies-status--ok',
    warning: 'supplies-status supplies-status--warning',
    expired: 'supplies-status supplies-status--expired',
  };

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
      status: computeExpiryStatus(value.expiryDate),
    };

    this.suppliesService
      .add(payload)
      .pipe(take(1))
      .subscribe(() => {
        this.closeDialog();
      });
r
  }

  trackBySupplyId(_: number, row: SupplyRow): string {
    return row.id;
  }


  getStatusLabel(status: SupplyStatus): string {
    return this.statusLabels[status];
  }

  getStatusClass(status: SupplyStatus): string {
    return this.statusClasses[status];
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
}
