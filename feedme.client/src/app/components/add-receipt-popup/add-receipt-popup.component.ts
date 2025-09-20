import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CatalogService, CatalogItem } from '../../services/catalog.service';
import { ReceiptService } from '../../services/receipt.service';
import { Receipt } from '../../models/receipt';

@Component({
  selector: 'app-add-receipt-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-receipt-popup.component.html',
  styleUrls: ['./add-receipt-popup.component.css']
})
export class AddReceiptPopupComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Input() warehouse = 'Главный склад';

  form = this.fb.group({
    productId: ['', Validators.required],
    supplierId: [{ value: '', disabled: true }],
    tnvedCode: [{ value: '', disabled: true }],
    writeoffMethod: [{ value: '', disabled: true }],
    unitPrice: [{ value: 0, disabled: true }],

    receiptDate: [new Date(), Validators.required],
    documentNumber: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.01)]],
    unit: ['шт', Validators.required],
    totalCost: [{ value: 0, disabled: true }],

    expiryDate: [null],
    batchCode: ['']
  });

  catalog: CatalogItem[] = [];
  units: string[] = [];
  private selectedCatalogItem: CatalogItem | null = null;

  constructor(
    private fb: FormBuilder,
    private catalogService: CatalogService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit(): void {
    this.catalogService.getAll().subscribe(items => (this.catalog = items));
    this.units = ['шт', 'кг', 'л', 'упаковка'];

    this.form.get('productId')!.valueChanges.subscribe(id => this.onProductChange(id));

    this.form.valueChanges.subscribe(() => {
      const { quantity, unitPrice } = this.form.getRawValue();
      const sum = Number(quantity ?? 0) * Number(unitPrice ?? 0);
      this.form.get('totalCost')!.setValue(sum, { emitEvent: false });
    });
  }

  onProductChange(id: string | null): void {
    if (!id) {
      this.selectedCatalogItem = null;
      return;
    }
    this.catalogService.getById(id).subscribe(item => {
      this.selectedCatalogItem = item;
      this.form.patchValue({
        supplierId: item.supplier,
        tnvedCode: item.tnved,
        writeoffMethod: item.writeoffMethod,
        unitPrice: item.unitPrice,
        unit: item.unit || this.form.get('unit')!.value
      });
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    const dto = this.buildReceiptDto();
    if (!dto) {
      return;
    }

    this.receiptService.saveReceipt(dto).subscribe(() => this.onClose());
  }

  onClose(): void {
    this.close.emit();
  }

  private buildReceiptDto(): Receipt | null {
    const raw = this.form.getRawValue();
    const catalogItem = this.resolveCatalogItem(raw.productId);

    if (!catalogItem) {
      return null;
    }

    const quantity = Number(raw.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return null;
    }

    const receivedAt = raw.receiptDate
      ? new Date(raw.receiptDate).toISOString()
      : new Date().toISOString();

    const itemName = (catalogItem.name ?? '').trim();
    const unit = (raw.unit || catalogItem.unit || '').toString().trim();

    const warehouse = (this.warehouse ?? '').trim();
    const supplier = (catalogItem.supplier ?? '').trim();

    const receipt: Receipt = {
      number: raw.documentNumber?.trim() ?? '',
      supplier,
      warehouse,
      receivedAt,
      items: [
        {
          catalogItemId: catalogItem.id,
          itemName,
          quantity,
          unit,
          unitPrice: Number(catalogItem.unitPrice)
        }
      ]
    };

    return receipt;
  }

  private resolveCatalogItem(id: string | null | undefined): CatalogItem | null {
    if (!id) {
      return null;
    }

    if (this.selectedCatalogItem?.id === id) {
      return this.selectedCatalogItem;
    }

    return this.catalog.find(item => item.id === id) ?? null;
  }
}
