import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideMockStore } from '@ngrx/store/testing';

import { CatalogComponent } from './catalog.component';
import { CatalogItem } from '../../services/catalog.service';
import { CatalogState, catalogFeatureKey } from '../../store/catalog/catalog.reducer';

describe('CatalogComponent', () => {
  let fixture: ComponentFixture<CatalogComponent>;
  let component: CatalogComponent;

  const mockItems: CatalogItem[] = [
    {
      id: '1',
      name: 'Сыр',
      type: 'Продукт',
      code: '100',
      category: 'Молочная продукция',
      unit: 'кг',
      weight: 1,
      writeoffMethod: 'FIFO',
      allergens: 'Молоко',
      packagingRequired: true,
      spoilsAfterOpening: false,
      supplier: 'Поставщик А',
      deliveryTime: 2,
      costEstimate: 450,
      taxRate: '10%',
      unitPrice: 500,
      salePrice: 650,
      tnved: '0406',
      isMarked: true,
      isAlcohol: false,
      alcoholCode: '',
      alcoholStrength: 0,
      alcoholVolume: 0,
    },
    {
      id: '2',
      name: 'Оливковое масло',
      type: 'Продукт',
      code: '200',
      category: 'Масла',
      unit: 'л',
      weight: 1,
      writeoffMethod: 'FIFO',
      allergens: 'Нет',
      packagingRequired: false,
      spoilsAfterOpening: true,
      supplier: 'Поставщик Б',
      deliveryTime: 5,
      costEstimate: 300,
      taxRate: '10%',
      unitPrice: 350,
      salePrice: 450,
      tnved: '1509',
      isMarked: false,
      isAlcohol: false,
      alcoholCode: '',
      alcoholStrength: 0,
      alcoholVolume: 0,
    },
  ];

  beforeEach(async () => {
    const initialState: Record<string, CatalogState> = {
      [catalogFeatureKey]: {
        items: mockItems,
        loading: false,
        loaded: true,
        loadError: null,
        creationStatus: 'idle',
        creationError: null,
      },
    };

    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('создаётся', () => {
    expect(component).toBeTruthy();
  });

  it('отображает флаги для каждого товара', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('app-catalog-table tbody tr'));
    expect(rows.length).toBe(mockItems.length);

    const firstFlags = rows[0].queryAll(By.css('.flag'));
    expect(firstFlags.length).toBe(2);
    const firstFlagTexts = firstFlags.map(flag => flag.nativeElement.textContent.trim());
    expect(firstFlagTexts).toContain('Требует фасовки');
    expect(firstFlagTexts).toContain('Портится после вскрытия');

    const secondFlags = rows[1].queryAll(By.css('.flag'));
    const secondFlagTexts = secondFlags.map(flag => flag.nativeElement.textContent.trim());
    expect(secondFlagTexts).toContain('Портится после вскрытия');
    expect(secondFlagTexts).not.toContain('Требует фасовки');
  });
});
