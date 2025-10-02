import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { SupplyProduct, SupplyRow } from '../shared/models';
import { SuppliesComponent } from './supplies.component';
import { SuppliesService } from './supplies.service';

class MockSuppliesService {
  private readonly productsSubject = new BehaviorSubject<SupplyProduct[]>([
    {
      id: 'prod-chicken',
      sku: 'MEAT-001',
      name: 'Курица охлаждённая',
      unit: 'кг',
      category: 'Мясо',
      supplier: 'ООО Куры Дуры',
      purchasePrice: 210,
    },
  ]);
  private readonly rowsSubject = new BehaviorSubject<SupplyRow[]>([]);
  private idCounter = 0;

  getAll(): Observable<SupplyRow[]> {
    return this.rowsSubject.asObservable();
  }

  getProducts(): Observable<SupplyProduct[]> {
    return this.productsSubject.asObservable();
  }

  getProductById(productId: string): SupplyProduct | undefined {
    return this.productsSubject.value.find((product) => product.id === productId);
  }

  add(row: SupplyRow | Omit<SupplyRow, 'id'>): Observable<SupplyRow> {
    const base = row as SupplyRow;
    const record: SupplyRow = {
      ...base,
      id: `mock-${++this.idCounter}`,
    };
    this.rowsSubject.next([record, ...this.rowsSubject.value]);
    return of(record);
  }

  reset(): void {
    this.rowsSubject.next([]);
    this.idCounter = 0;
  }

  snapshot(): SupplyRow[] {
    return this.rowsSubject.value;
  }
}

describe('SuppliesComponent', () => {
  let fixture: ComponentFixture<SuppliesComponent>;
  let component: SuppliesComponent;
  let service: MockSuppliesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliesComponent],
      providers: [
        MockSuppliesService,
        { provide: SuppliesService, useExisting: MockSuppliesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SuppliesComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MockSuppliesService);
    service.reset();
    fixture.detectChanges();
  });

  function formatISO(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  it('computes status before saving and sends payload to service', () => {
    const addSpy = spyOn(service, 'add').and.callThrough();
    const expiry = formatISO(2);

    component.openDialog();
    component.form.setValue({
      docNo: 'PO-999999',
      arrivalDate: formatISO(-8),
      warehouse: 'Главный склад',
      responsible: 'Петров П.',
      productId: 'prod-chicken',
      qty: 12,
      expiryDate: expiry,
    });

    component.submit();

    expect(addSpy).toHaveBeenCalledTimes(1);
    const payload = addSpy.calls.mostRecent().args[0] as SupplyRow;
    expect(payload.status).toBe('warning');
    expect(payload.sku).toBe('MEAT-001');
    expect(payload.name).toBe('Курица охлаждённая');
    expect(payload.unit).toBe('кг');
    expect(payload.supplier).toBe('ООО Куры Дуры');
  });

  it('updates the stream after successful save', () => {
    spyOn(service, 'add').and.callThrough();
    const expiry = formatISO(30);

    component.openDialog();
    component.form.setValue({
      docNo: 'PO-000123',
      arrivalDate: formatISO(-1),
      warehouse: 'Бар',
      responsible: '',
      productId: 'prod-chicken',
      qty: 5,
      expiryDate: expiry,
    });

    component.submit();

    const rows = service.snapshot();
    expect(rows.length).toBe(1);
    expect(rows[0].docNo).toBe('PO-000123');
    expect(rows[0].status).toBe('ok');
    expect(rows[0].id).toContain('mock-');
  });

  it('computes KPI summary based on supply data', () => {
    const todaySupply: Omit<SupplyRow, 'id'> = {
      docNo: 'PO-000200',
      arrivalDate: formatISO(0),
      warehouse: 'Главный склад',
      responsible: 'Иванов И.',
      productId: 'prod-chicken',
      sku: 'MEAT-001',
      name: 'Курица охлаждённая',
      qty: 10,
      unit: 'кг',
      expiryDate: formatISO(5),
      supplier: 'ООО Куры Дуры',
      status: 'ok',
    };

    const expiredSupply: Omit<SupplyRow, 'id'> = {
      docNo: 'PO-000201',
      arrivalDate: formatISO(-5),
      warehouse: 'Бар',
      responsible: 'Петров П.',
      productId: 'prod-chicken',
      sku: 'MEAT-001',
      name: 'Курица охлаждённая',
      qty: 2,
      unit: 'кг',
      expiryDate: formatISO(-1),
      supplier: 'ООО Куры Дуры',
      status: 'expired',
    };

    const oldSupply: Omit<SupplyRow, 'id'> = {
      docNo: 'PO-000199',
      arrivalDate: formatISO(-15),
      warehouse: 'Резерв',
      responsible: 'Сидоров С.',
      productId: 'prod-chicken',
      sku: 'MEAT-001',
      name: 'Курица охлаждённая',
      qty: 3,
      unit: 'кг',
      expiryDate: formatISO(-5),
      supplier: 'ООО Куры Дуры',
      status: 'warning',
    };

    service.add(todaySupply).subscribe();
    service.add(expiredSupply).subscribe();
    service.add(oldSupply).subscribe();

    fixture.detectChanges();

    const summary = component.kpi();
    expect(summary.weekSupplies).toBe(2);
    expect(summary.expired).toBe(1);
    expect(summary.items).toBe(1);
    expect(summary.weekSpend).toBe(2520);
  });
});
