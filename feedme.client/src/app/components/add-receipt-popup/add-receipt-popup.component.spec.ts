import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AddReceiptPopupComponent } from './add-receipt-popup.component';
import { CatalogService, CatalogItem } from '../../services/catalog.service';
import { Receipt, ReceiptService } from '../../services/receipt.service';

describe('AddReceiptPopupComponent', () => {
  let component: AddReceiptPopupComponent;
  let fixture: ComponentFixture<AddReceiptPopupComponent>;
  let catalogService: jasmine.SpyObj<CatalogService>;
  let receiptService: jasmine.SpyObj<ReceiptService>;
  const runInContext = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

  const catalogItem: CatalogItem = {
    id: 'product-1',
    name: 'Помидоры',
    type: 'Ingredient',
    code: 'PRD-001',
    category: 'Овощи',
    unit: 'кг',
    weight: 1,
    writeoffMethod: 'FIFO',
    allergens: 'нет',
    packagingRequired: false,
    spoilsAfterOpening: true,
    supplier: 'ООО Поставщик',
    deliveryTime: 2,
    costEstimate: 120,
    taxRate: '20%',
    unitPrice: 150,
    salePrice: 200,
    tnved: '0702000000',
    isMarked: false,
    isAlcohol: false,
    alcoholCode: '',
    alcoholStrength: 0,
    alcoholVolume: 0
  };

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>('CatalogService', ['getAll', 'getById']);
    receiptService = jasmine.createSpyObj<ReceiptService>('ReceiptService', ['saveReceipt']);

    catalogService.getAll.and.returnValue(of([catalogItem]));
    catalogService.getById.and.returnValue(of(catalogItem));

    const createdReceipt: Receipt = {
      id: 'receipt-1',
      number: 'RCPT-001',
      supplier: catalogItem.supplier,
      warehouse: 'Главный склад',
      receivedAt: '2024-04-15T00:00:00.000Z',
      items: [
        {
          catalogItemId: catalogItem.id,
          itemName: catalogItem.name,
          quantity: 5,
          unit: 'кг',
          unitPrice: catalogItem.unitPrice,
          totalCost: catalogItem.unitPrice * 5,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning'
        }
      ],
      totalAmount: catalogItem.unitPrice * 5
    };

    receiptService.saveReceipt.and.returnValue(of(createdReceipt));

    await TestBed.configureTestingModule({
      imports: [AddReceiptPopupComponent],
      providers: [
        { provide: CatalogService, useValue: catalogService },
        { provide: ReceiptService, useValue: receiptService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddReceiptPopupComponent);
    component = fixture.componentInstance;
    runInContext(() => fixture.detectChanges());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close on onClose', () => {
    runInContext(() => {
      spyOn(component.close, 'emit');
      const btn = fixture.debugElement.query(By.css('[data-testid="cancel-button"]'));
      btn.nativeElement.click();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  it('should construct receipt payload and close popup on submit', () => {
    runInContext(() => {
      spyOn(component.close, 'emit');

      component.form.controls.productId.setValue(catalogItem.id);
      component.form.controls.number.setValue(' RCPT-001 ');
      component.form.controls.warehouse.setValue('  Главный склад  ');
      component.form.controls.receivedAt.setValue('2024-04-15');
      component.form.controls.quantity.setValue(5);
      component.form.controls.unit.setValue('кг');
      component.form.controls.expiryDate.setValue('2024-04-25');

      component.onSubmit();

      expect(receiptService.saveReceipt).toHaveBeenCalledWith({
        number: 'RCPT-001',
        supplier: catalogItem.supplier,
        warehouse: 'Главный склад',
        receivedAt: '2024-04-15T00:00:00.000Z',
        items: [
          {
            catalogItemId: catalogItem.id,
            itemName: catalogItem.name,
            quantity: 5,
            unit: 'кг',
            unitPrice: catalogItem.unitPrice,
            expiryDate: '2024-04-25T00:00:00.000Z'
          }
        ]
      });

      expect(component.close.emit).toHaveBeenCalled();
    });
  });
});
