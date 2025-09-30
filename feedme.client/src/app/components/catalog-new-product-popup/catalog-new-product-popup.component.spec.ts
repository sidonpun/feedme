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
      name: 'Item',
      type: 'Товар',
      code: '001',
      category: 'Категория',
      unit: 'кг',
      writeoffMethod: 'FIFO',
      allergens: '',
      packagingRequired: false,
      spoilsAfterOpening: false,
      supplier: '',
      costEstimate: 0,
      taxRate: '10%',
      unitPrice: 10,
      salePrice: 0,
      tnved: '',
      isMarked: false,
      isAlcohol: false,
      alcoholCode: '',
      alcoholStrength: 0,
      alcoholVolume: 0
    });
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});
    expect(component.save.emit).toHaveBeenCalled();
  });
});
