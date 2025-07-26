import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CatalogNewProductPopupComponent } from './catalog-new-product-popup.component';

describe('CatalogNewProductPopupComponent', () => {
  let component: CatalogNewProductPopupComponent;
  let fixture: ComponentFixture<CatalogNewProductPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogNewProductPopupComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogNewProductPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit cancel event on cancel', () => {
    spyOn(component.cancel, 'emit');
    const button = fixture.debugElement.query(By.css('.cancel-btn'));
    button.nativeElement.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit save event on submit', () => {
    spyOn(component.save, 'emit');
    component.form.setValue({
      productName: 'Item',
      category: 'Готовое блюдо',
      taxRate: '10%',
      unit: 'шт',
      unitPrice: 10,
      description: '',
      requiresPackaging: false,
      perishableAfterOpening: false
    });
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});
    expect(component.save.emit).toHaveBeenCalled();
  });
});
