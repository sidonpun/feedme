import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AddReceiptPopupComponent } from './add-receipt-popup.component';
import { CatalogService } from '../../services/catalog.service';
import { ReceiptService } from '../../services/receipt.service';

describe('AddReceiptPopupComponent', () => {
  let component: AddReceiptPopupComponent;
  let fixture: ComponentFixture<AddReceiptPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddReceiptPopupComponent],
      providers: [
        { provide: CatalogService, useValue: { getAll: () => of([]), getById: () => of() } },
        { provide: ReceiptService, useValue: { saveReceipt: () => of() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddReceiptPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close on onClose', () => {
    spyOn(component.close, 'emit');
    const btn = fixture.debugElement.query(By.css('.cancel-btn'));
    btn.nativeElement.click();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
