import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { WarehousePageComponent } from './warehouse-page.component';
import { SupplyRow, SupplyStatus } from './models';
import {
  CreateSupplyPayload,
  WarehouseMetrics,
  WarehouseService,
} from './warehouse.service';
import { WarehouseCatalogService } from './catalog/catalog.service';
import { Product } from './shared/models';

const INITIAL_ROWS: SupplyRow[] = [
  buildRow('receipt-1', 'PO-000851', 'Главный склад', 'MEAT-001', 'Курица'),
  buildRow('receipt-2', 'PO-000852', 'Кухня', 'MEAT-002', 'Говядина', 'warning'),
];

class InMemoryWarehouseService {
  private readonly rowsSignal = signal<SupplyRow[]>(structuredClone(INITIAL_ROWS));
  private readonly metricsSignal = signal<WarehouseMetrics>({
    suppliesLastWeek: 2,
    purchaseAmountLastWeek: INITIAL_ROWS.reduce((sum, row) => sum + row.qty * row.price, 0),
    positions: INITIAL_ROWS.length,
    expired: 0,
  });
  private idCounter = INITIAL_ROWS.length + 1;

  list = () => this.rowsSignal.asReadonly();
  metrics = () => this.metricsSignal.asReadonly();

  metricsForWarehouse(): WarehouseMetrics {
    return this.metricsSignal();
  }

  async addRow(payload: CreateSupplyPayload): Promise<SupplyRow> {
    const created: SupplyRow = {
      id: `receipt-${this.idCounter++}`,
      productId: payload.productId,
      docNo: payload.docNo,
      arrivalDate: payload.arrivalDate,
      warehouse: payload.warehouse,
      responsible: payload.responsible,
      supplier: payload.supplier,
      sku: payload.sku,
      name: payload.name,
      category: payload.category,
      qty: payload.qty,
      unit: payload.unit,
      price: payload.price,
      expiry: payload.expiry,
      status: payload.status,
    } satisfies SupplyRow;

    this.rowsSignal.update((rows) => [created, ...rows]);
    return created;
  }

  async updateRow(row: SupplyRow): Promise<SupplyRow> {
    this.rowsSignal.update((rows) =>
      rows.map((current) => (current.id === row.id ? { ...row } : current)),
    );
    return row;
  }

  async removeRowsById(ids: readonly string[]): Promise<void> {
    const idSet = new Set(ids);
    this.rowsSignal.update((rows) => rows.filter((row) => !idSet.has(row.id)));
  }

  reset(): void {
    this.rowsSignal.set(structuredClone(INITIAL_ROWS));
  }
}

class StubWarehouseCatalogService {
  getAll() {
    return of([buildProduct()]);
  }

  refresh() {
    return of([buildProduct()]);
  }
}

function buildRow(
  id: string,
  docNo: string,
  warehouse: string,
  sku: string,
  name: string,
  status: SupplyStatus = 'ok',
): SupplyRow {
  return {
    id,
    productId: 'product-1',
    docNo,
    arrivalDate: '2025-09-25',
    warehouse,
    responsible: 'Иванов И.',
    supplier: 'ООО Поставщик',
    sku,
    name,
    category: 'Категория',
    qty: 5,
    unit: 'кг',
    price: 120,
    expiry: '2025-10-05',
    status,
  } satisfies SupplyRow;
}

function buildProduct(): Product {
  return {
    id: 'product-1',
    name: 'Картофель',
    type: 'ingredient',
    sku: 'VEG-001',
    category: 'Овощи',
    unit: 'кг',
    unitWeight: null,
    writeoff: 'fifo',
    allergens: null,
    needsPacking: false,
    perishableAfterOpen: false,
    supplierMain: 'ОвощБаза',
    leadTimeDays: 2,
    costEst: 40,
    vat: 'Без НДС',
    purchasePrice: 60,
    salePrice: 90,
    tnvCode: null,
    marked: false,
    alcohol: false,
    alcoholCode: null,
    alcoholStrength: null,
    alcoholVolume: null,
  } satisfies Product;
}

describe('WarehousePageComponent', () => {
  let fixture: ComponentFixture<WarehousePageComponent>;
  let component: WarehousePageComponent;
  let warehouseService: InMemoryWarehouseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehousePageComponent],
      providers: [
        InMemoryWarehouseService,
        { provide: WarehouseService, useExisting: InMemoryWarehouseService },
        { provide: WarehouseCatalogService, useClass: StubWarehouseCatalogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WarehousePageComponent);
    component = fixture.componentInstance;
    warehouseService = TestBed.inject(InMemoryWarehouseService);
    warehouseService.reset();
    fixture.detectChanges();
  });

  it('renders rows provided by the service', () => {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(INITIAL_ROWS.length);
  });

  it('creates a supply via dialog payload and updates the table', async () => {
    component.openCreateDialog();
    fixture.detectChanges();

    await component.handleCreateSupply({
      product: buildProduct(),
      quantity: 3,
      arrivalDate: '2025-10-01',
      expiryDate: '2025-10-10',
    });

    fixture.detectChanges();
    const [row] = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(row.textContent).toContain('PO-');
  });

  it('removes selected rows via bulk action', async () => {
    component.toggleAll(true);
    component.openDeleteDialogForSelection();
    fixture.detectChanges();

    await component.confirmDelete();
    fixture.detectChanges();

    const emptyRow = fixture.nativeElement.querySelector('.warehouse-page__empty-row');
    expect(emptyRow.textContent).toContain('Нет поставок');
  });
});
