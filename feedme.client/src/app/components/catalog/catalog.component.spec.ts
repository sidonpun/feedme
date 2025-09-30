import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { CatalogComponent } from './catalog.component';
import { CatalogService, CatalogItem } from '../../services/catalog.service';

describe('CatalogComponent', () => {
  let fixture: ComponentFixture<CatalogComponent>;
  let component: CatalogComponent;
  let catalogService: jasmine.SpyObj<CatalogService>;

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
    catalogService = jasmine.createSpyObj<CatalogService>('CatalogService', ['getAll', 'create', 'getById']);
    catalogService.getAll.and.returnValue(of(mockItems));
    catalogService.create.and.returnValue(of(mockItems[0]));

    await TestBed.configureTestingModule({
      imports: [CatalogComponent],
      providers: [{ provide: CatalogService, useValue: catalogService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('создаётся', () => {
    expect(component).toBeTruthy();
  });

  it('отображает форматированные флаги для каждого товара', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(mockItems.length);

    const firstFlagCellText = rows[0].query(By.css('td:nth-child(8)'))!.nativeElement.textContent;
    expect(firstFlagCellText).toContain('Требует фасовки: Да');
    expect(firstFlagCellText).toContain('Портится после вскрытия: Нет');

    const secondFlagCellText = rows[1].query(By.css('td:nth-child(8)'))!.nativeElement.textContent;
    expect(secondFlagCellText).toContain('Требует фасовки: Нет');
    expect(secondFlagCellText).toContain('Портится после вскрытия: Да');
  });
});
