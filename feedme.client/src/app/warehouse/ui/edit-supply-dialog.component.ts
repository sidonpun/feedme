import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { SUPPLY_STATUSES, SupplyRow, SupplyStatus } from '../models';

@Component({
  selector: 'app-edit-supply-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-supply-dialog.component.html',
  styleUrl: './edit-supply-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditSupplyDialogComponent implements OnChanges {
  @Input() supply: SupplyRow | null = null;
  @Input() pending = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<SupplyRow>();

  readonly statuses = SUPPLY_STATUSES;

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    arrivalDate: this.fb.control('', { validators: [Validators.required] }),
    warehouse: this.fb.control('', { validators: [Validators.required] }),
    responsible: this.fb.control(''),
    supplier: this.fb.control('', { validators: [Validators.required] }),
    qty: this.fb.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.0001)],
    }),
    unit: this.fb.control('', { validators: [Validators.required] }),
    expiry: this.fb.control('', { validators: [Validators.required] }),
    status: this.fb.control<SupplyStatus>('ok', { validators: [Validators.required] }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supply']) {
      this.populateForm(this.supply);
    }
  }

  submit(): void {
    if (!this.supply) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const qty = Number(value.qty);
    if (!Number.isFinite(qty) || qty <= 0) {
      this.form.controls.qty.setErrors({ min: true });
      return;
    }

    this.save.emit({
      ...this.supply,
      arrivalDate: value.arrivalDate,
      warehouse: value.warehouse,
      responsible: value.responsible ?? '',
      supplier: value.supplier,
      qty,
      unit: value.unit,
      expiry: value.expiry,
      status: value.status,
    });
  }

  close(): void {
    this.cancel.emit();
  }

  trackStatus = (_: number, status: SupplyStatus) => status;

  private populateForm(supply: SupplyRow | null): void {
    if (!supply) {
      this.form.reset({
        arrivalDate: '',
        warehouse: '',
        responsible: '',
        supplier: '',
        qty: null,
        unit: '',
        expiry: '',
        status: 'ok',
      });
      this.form.markAsPristine();
      this.form.markAsUntouched();
      return;
    }

    this.form.reset({
      arrivalDate: supply.arrivalDate,
      warehouse: supply.warehouse,
      responsible: supply.responsible,
      supplier: supply.supplier,
      qty: supply.qty,
      unit: supply.unit,
      expiry: supply.expiry,
      status: supply.status,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
