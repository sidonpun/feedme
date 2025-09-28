import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SimpleChange, SimpleChanges } from '@angular/core';

import { SupplyTableComponent } from './supply-table.component';

describe('SupplyTableComponent', () => {
  let component: SupplyTableComponent;
  let fixture: ComponentFixture<SupplyTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyTableComponent);
    component = fixture.componentInstance;
  });

  it('shows empty state when no supplies are provided', () => {
    component.data = [];
    component.ngOnChanges({ data: new SimpleChange([], component.data, true) } as SimpleChanges);
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('app-empty'));
    expect(emptyState).not.toBeNull();
  });

  it('hides empty state when at least one supply exists', () => {
    component.data = [
      {
        productName: 'Молоко',
        category: 'Молочная продукция',
        stock: 10,
        unitPrice: 100,
        expiryDate: '2025-12-31',
        responsible: 'Главный склад',
        supplier: 'ООО "Поставщик"'
      },
    ];

    component.ngOnChanges({ data: new SimpleChange([], component.data, true) } as SimpleChanges);
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('app-empty'));
    expect(emptyState).toBeNull();
  });

  it('should emit onSettingsClick when settings button is clicked', () => {
    const supply = {
      productName: 'Молоко',
      category: 'Молочная продукция',
      stock: 10,
      unitPrice: 100,
      expiryDate: '2025-12-31',
      responsible: 'Главный склад',
      supplier: 'ООО "Поставщик"'
    };

    component.data = [supply];
    component.ngOnChanges({ data: new SimpleChange([], component.data, true) } as SimpleChanges);
    fixture.detectChanges();

    spyOn(component.onSettingsClick, 'emit');

    const settingsButton = fixture.debugElement.query(By.css('button[aria-label="Меню"]'));
    settingsButton.nativeElement.click();

    expect(component.onSettingsClick.emit).toHaveBeenCalledWith(supply);
  });
});
