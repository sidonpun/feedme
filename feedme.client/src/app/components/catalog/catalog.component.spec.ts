import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideMockStore } from '@ngrx/store/testing';

import { CatalogComponent } from './catalog.component';
import { CatalogItem } from '../../services/catalog.service';
import { CatalogState, catalogFeatureKey } from '../../store/catalog/catalog.reducer';
import { CatalogFlagListComponent } from './catalog-flag-list/catalog-flag-list.component';
import { CATALOG_FLAG_FULL_MAP, CATALOG_FLAG_SHORT_MAP } from '../../constants/catalog-flags';

describe('CatalogComponent', () => {
  let fixture: ComponentFixture<CatalogComponent>;
  let component: CatalogComponent;

  const mockItems: CatalogItem[] = [
    {
      id: '1',
      name: 'Sample Item A',
      type: 'Category Type',
      code: '100',
      category: 'Category Alpha',
      unit: 'kg',
      weight: 1,
      writeoffMethod: 'FIFO',
      allergens: 'None',
      packagingRequired: true,
      spoilsAfterOpening: false,
      supplier: 'Supplier One',
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
      name: 'Sample Item B',
      type: 'Category Type',
      code: '200',
      category: 'Category Beta',
      unit: 'pcs',
      weight: 1,
      writeoffMethod: 'FIFO',
      allergens: 'Peanuts',
      packagingRequired: false,
      spoilsAfterOpening: true,
      supplier: 'Supplier Two',
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

  it('creates the component instance', () => {
    expect(component).toBeTruthy();
  });

  it('renders flag overflow indicator', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(mockItems.length);

    const firstFlagList = rows[0].query(By.directive(CatalogFlagListComponent))!;
    const firstFlagListText = firstFlagList.nativeElement.textContent.trim();
    const shortPack = CATALOG_FLAG_SHORT_MAP.pack;
    const shortTemp = CATALOG_FLAG_SHORT_MAP.temp;
    expect(firstFlagListText).toContain(shortPack);
    expect(firstFlagListText).toContain(shortTemp);

    const secondFlagList = rows[1].query(By.directive(CatalogFlagListComponent))!;
    const listComponent = secondFlagList.componentInstance as CatalogFlagListComponent;

    const container = secondFlagList.nativeElement.querySelector('.catalog-flags') as HTMLElement;
    Object.defineProperty(container, 'clientWidth', { configurable: true, get: () => 200 });

    const measureHost = secondFlagList.nativeElement.querySelector('.catalog-flags--measure') as HTMLElement;
    const allMeasureEls = Array.from(measureHost.querySelectorAll('.catalog-flag')) as HTMLElement[];
    const visibleMeasureEls = allMeasureEls.slice(0, (listComponent.flags ?? []).length);
    const moreMeasureEl = allMeasureEls[visibleMeasureEls.length];

    visibleMeasureEls.forEach((element) => {
      Object.defineProperty(element, 'offsetWidth', { configurable: true, get: () => 60 });
    });

    if (moreMeasureEl) {
      Object.defineProperty(moreMeasureEl, 'offsetWidth', { configurable: true, get: () => 36 });
    }

    (listComponent as unknown as { updateVisibility(): void }).updateVisibility();
    fixture.detectChanges();

    const secondFlagListText = secondFlagList.nativeElement.textContent;
    const shortSpoil = CATALOG_FLAG_SHORT_MAP.spoil_open;
    const shortFragile = CATALOG_FLAG_SHORT_MAP.fragile;
    expect(secondFlagListText).toContain(shortSpoil);
    expect(secondFlagListText).toContain(shortFragile);
    expect(secondFlagListText).toContain('+2');

    const moreChip = secondFlagList.nativeElement.querySelector('.catalog-flag--more') as HTMLElement;
    expect(moreChip.getAttribute('title')).toBe(CATALOG_FLAG_FULL_MAP.temp);
  });
});
