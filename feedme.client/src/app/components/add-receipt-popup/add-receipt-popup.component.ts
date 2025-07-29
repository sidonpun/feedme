import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CatalogService, CatalogItem } from '../../services/catalog.service';
import { ReceiptService } from '../../services/receipt.service';

@Component({
  selector: 'app-add-receipt-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-receipt-popup.component.html',
  styleUrls: ['./add-receipt-popup.component.css']
})
export class AddReceiptPopupComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  form = this.fb.group({
    productId: ['', Validators.required],
    supplierId: [{ value: '', disabled: true }],
    tnvedCode: [{ value: '', disabled: true }],
    writeoffMethod: [{ value: '', disabled: true }],
    unitPrice: [{ value: 0, disabled: true }],

    receiptDate: [new Date(), Validators.required],
    documentNumber: [''],
    quantity: [0, Validators.required],
    unit: ['шт', Validators.required],
    totalCost: [{ value: 0, disabled: true }],

    expiryDate: [null],
    batchCode: ['']
  });

  catalog: CatalogItem[] = [];
  units: string[] = [];

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit(): void {
    this.catalogService.getAll().subscribe(items => (this.catalog = items));
    this.units = ['шт', 'кг', 'л', 'упаковка'];

    this.form.get('productId')!.valueChanges.subscribe(id => this.onProductChange(id));

    this.form.valueChanges.subscribe(v => {
      const sum = (v.quantity || 0) * (v.unitPrice || 0);
      this.form.get('totalCost')!.setValue(sum, { emitEvent: false });
    });
  }

  onProductChange(id: string | null): void {
    if (!id) return;
    this.catalogService.getById(id).subscribe(item => {
      this.form.patchValue({
        supplierId: item.supplierId,
        tnvedCode: item.tnvedCode,
        writeoffMethod: item.writeoffMethod,
        unitPrice: item.unitPrice
      });
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data = { ...this.form.getRawValue() };
      this.receiptService.saveReceipt(data).subscribe(() => this.onClose());
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
