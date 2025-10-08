import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, startWith } from 'rxjs';

import { CatalogService, CatalogItem } from '../../services/catalog.service';
import { CreateReceipt, ReceiptService } from '../../services/receipt.service';
import { computeExpiryStatus } from '../../warehouse/shared/status.util';

type AddReceiptFormControls = {
  productId: FormControl<string>;
  supplier: FormControl<string>;
  tnvedCode: FormControl<string>;
  writeoffMethod: FormControl<string>;
  unitPrice: FormControl<number>;
  receivedAt: FormControl<string>;
  number: FormControl<string>;
  warehouse: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<string>;
  totalCost: FormControl<number>;
  expiryDate: FormControl<string | null>;
  batchCode: FormControl<string>;
};

@Component({
  selector: 'app-add-receipt-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-receipt-popup.component.html',
  styleUrls: ['./add-receipt-popup.component.css']
})
export class AddReceiptPopupComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  @Input()
  set initialWarehouse(value: string | null) {
    const normalized = (value ?? '').trim();
    if (normalized) {
      this.form.controls.warehouse.setValue(normalized);
    }
  }

  readonly form = this.fb.group<AddReceiptFormControls>({
    productId: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    supplier: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    tnvedCode: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    writeoffMethod: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    unitPrice: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    receivedAt: this.fb.control(this.formatDate(new Date()), {
      validators: [Validators.required],
      nonNullable: true
    }),
    number: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    warehouse: this.fb.control('Главный склад', { validators: [Validators.required], nonNullable: true }),
    quantity: this.fb.control(1, {
      validators: [Validators.required, Validators.min(0.01)],
      nonNullable: true
    }),
    unit: this.fb.control('шт', { validators: [Validators.required], nonNullable: true }),
    totalCost: new FormControl({ value: 0, disabled: true }, { nonNullable: true }),
    expiryDate: new FormControl<string | null>(null),
    batchCode: this.fb.control('', { nonNullable: true })
  });

  catalog: CatalogItem[] = [];
  units: string[] = [];
  private selectedProduct: CatalogItem | null = null;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit(): void {
    this.catalogService
      .getAll()
      .pipe(takeUntilDestroyed())
      .subscribe(items => (this.catalog = items));

    this.units = ['шт', 'кг', 'л', 'упаковка'];

    this.form.controls.productId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(id => this.onProductChange(id));

    combineLatest([
      this.form.controls.quantity.valueChanges.pipe(startWith(this.form.controls.quantity.value)),
      this.form.controls.unitPrice.valueChanges.pipe(startWith(this.form.controls.unitPrice.getRawValue()))
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([quantity, unitPrice]) => this.updateTotalCost(Number(quantity), Number(unitPrice)));
  }

  onProductChange(id: string | null): void {
    if (!id) {
      this.selectedProduct = null;
      this.form.controls.supplier.setValue('', { emitEvent: false });
      this.form.controls.tnvedCode.setValue('', { emitEvent: false });
      this.form.controls.writeoffMethod.setValue('', { emitEvent: false });
      this.form.controls.unitPrice.setValue(0);
      this.form.controls.unit.setValue('шт');
      return;
    }

    this.catalogService
      .getById(id)
      .pipe(takeUntilDestroyed())
      .subscribe(item => {
        this.selectedProduct = item;
        this.form.controls.supplier.setValue(item.supplier, { emitEvent: false });
        this.form.controls.tnvedCode.setValue(item.tnved, { emitEvent: false });
        this.form.controls.writeoffMethod.setValue(item.writeoffMethod, { emitEvent: false });
        this.form.controls.unitPrice.setValue(item.unitPrice);
        this.form.controls.unit.setValue(item.unit || this.form.controls.unit.value);
      });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const rawValue = this.form.getRawValue();
    const product = this.selectedProduct ?? this.catalog.find(item => item.id === rawValue.productId);

    if (!product) {
      return;
    }

    const number = rawValue.number.trim();
    const warehouse = rawValue.warehouse.trim();
    const quantity = Number(rawValue.quantity);
    const unit = (rawValue.unit || product.unit || '').trim();

    if (!number) {
      this.form.controls.number.setErrors({ required: true });
      return;
    }

    if (!warehouse) {
      this.form.controls.warehouse.setErrors({ required: true });
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.form.controls.quantity.setErrors({ min: true });
      return;
    }

    if (!unit) {
      this.form.controls.unit.setErrors({ required: true });
      return;
    }

    const expiryIso = rawValue.expiryDate ? this.toIsoDate(rawValue.expiryDate) : null;

    const status = computeExpiryStatus(expiryIso, rawValue.receivedAt) ?? 'ok';

    const payload: CreateReceipt = {
      number,
      supplier: rawValue.supplier?.trim() || product.supplier,
      warehouse,
      responsible: 'Не назначен',
      receivedAt: this.toIsoDate(rawValue.receivedAt),
      items: [
        {
          catalogItemId: product.id,
          sku: product.code,
          itemName: product.name,
          category: product.category,
          quantity,
          unit,
          unitPrice: product.unitPrice,
          expiryDate: expiryIso,
          status,
        }
      ]
    };

    this.receiptService.saveReceipt(payload).subscribe(() => this.onClose());
  }

  onClose(): void {
    this.close.emit();
  }

  private updateTotalCost(quantity: number, unitPrice: number): void {
    const total = Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0;
    this.form.controls.totalCost.setValue(total, { emitEvent: false });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toIsoDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);

    if (!year || !month || !day) {
      return new Date().toISOString();
    }

    return new Date(Date.UTC(year, month - 1, day)).toISOString();
  }
}
