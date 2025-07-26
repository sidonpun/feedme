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
    component.productName = 'Item';
    component.category = 'Готовое блюдо';
    component.taxRate = '10%';
    component.unit = 'шт';
    component.unitPrice = '10';
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});
    expect(component.save.emit).toHaveBeenCalled();
  });
});
