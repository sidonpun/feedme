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
      name: 'Р РЋРЎвЂ№РЎР‚',
      type: 'Р СџРЎР‚Р С•Р Т‘РЎС“Р С”РЎвЂљ',
      code: '100',
      category: 'Р СљР С•Р В»Р С•РЎвЂЎР Р…Р В°РЎРЏ Р С—РЎР‚Р С•Р Т‘РЎС“Р С”РЎвЂ Р С‘РЎРЏ',
      unit: 'Р С”Р С–',
      weight: 1,
      writeoffMethod: 'FIFO',
      allergens: 'Р СљР С•Р В»Р С•Р С”Р С•',
      packagingRequired: true,
      spoilsAfterOpening: false,
      supplier: 'Р СџР С•РЎРѓРЎвЂљР В°Р Р†РЎвЂ°Р С‘Р С” Р С’',
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
      flags: [
        { code: 'pack' },
        { code: 'temp' },
      ],
    },
    {
      id: '2',
      name: 'Р С›Р В»Р С‘Р Р†Р С”Р С•Р Р†Р С•Р Вµ Р СР В°РЎРѓР В»Р С•',
      type: 'Р СџРЎР‚Р С•Р Т‘РЎС“Р С”РЎвЂљ',
      code: '200',
      category: 'Р СљР В°РЎРѓР В»Р В°',
      unit: 'Р В»',
      weight: 1,
      writeoffMethod: 'FIFO',
      allergens: 'Р СњР ВµРЎвЂљ',
      packagingRequired: false,
      spoilsAfterOpening: true,
      supplier: 'Р СџР С•РЎРѓРЎвЂљР В°Р Р†РЎвЂ°Р С‘Р С” Р вЂ',
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
      flags: [
        { code: 'spoil_open' },
        { code: 'fragile' },
        { code: 'pack' },
        { code: 'temp' },
      ],
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

  it('РЎРѓР С•Р В·Р Т‘Р В°РЎвЂРЎвЂљРЎРѓРЎРЏ', () => {
    expect(component).toBeTruthy();
  });

  it('Р С•РЎвЂљР С•Р В±РЎР‚Р В°Р В¶Р В°Р ВµРЎвЂљ РЎвЂћР С•РЎР‚Р СР В°РЎвЂљР С‘РЎР‚Р С•Р Р†Р В°Р Р…Р Р…РЎвЂ№Р Вµ РЎвЂћР В»Р В°Р С–Р С‘ Р Т‘Р В»РЎРЏ Р С”Р В°Р В¶Р Т‘Р С•Р С–Р С• РЎвЂљР С•Р Р†Р В°РЎР‚Р В°', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(mockItems.length);

    const firstFlagCell = rows[0].query(By.css('td:nth-child(8)'))!;
    const firstFlagCellText = firstFlagCell.nativeElement.textContent.trim();
    expect(firstFlagCellText).toContain('Фас.');
    expect(firstFlagCellText).toContain('Темп.');

    const secondFlagCell = rows[1].query(By.css('td:nth-child(8)'))!;
    const secondFlagCellText = secondFlagCell.nativeElement.textContent;
    expect(secondFlagCellText).toContain('После вскр.');
    expect(secondFlagCellText).toContain('Хрупк.');
    expect(secondFlagCellText).toContain('+1');

    const moreChip = secondFlagCell.query(By.css('.flag.more'))!.nativeElement as HTMLElement;
    expect(moreChip.getAttribute('title')).toBe('Требует температурный режим');
  });
});
