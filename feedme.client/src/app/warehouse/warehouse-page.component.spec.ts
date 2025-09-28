import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehousePageComponent } from './warehouse-page.component';
import { SupplyRow } from './models';
import { WarehouseService } from './warehouse.service';

class InMemoryWarehouseService {
  private readonly initialRows: SupplyRow[] = [
    {
      id: 1,
      docNo: 'PO-000851',
      arrivalDate: '2025-09-25',
      warehouse: 'Главный склад',
      responsible: 'Иванов И.',
      sku: 'MEAT-001',
      name: 'Курица охлажд.',
      category: 'Мясные заготовки',
      qty: 120,
      unit: 'кг',
      price: 220,
      expiry: '2025-10-03',
      supplier: 'ООО Куры Дуры',
      status: 'ok',
    },
    {
      id: 2,
      docNo: 'PO-000852',
      arrivalDate: '2025-09-27',
      warehouse: 'Кухня',
      responsible: 'Петров П.',
      sku: 'MEAT-002',
      name: 'Говядина',
      category: 'Мясные заготовки',
      qty: 11,
      unit: 'кг',
      price: 450,
      expiry: '2025-09-28',
      supplier: 'Ферма №5',
      status: 'warning',
    },
    {
      id: 3,
      docNo: 'PO-000853',
      arrivalDate: '2025-09-26',
      warehouse: 'Главный склад',
      responsible: 'Иванов И.',
      sku: 'VEG-011',
      name: 'Лук репчатый',
      category: 'Овощи',
      qty: 35,
      unit: 'кг',
      price: 28,
      expiry: '2025-10-15',
      supplier: 'ОвощБаза',
      status: 'ok',
    },
    {
      id: 4,
      docNo: 'PO-000854',
      arrivalDate: '2025-09-20',
      warehouse: 'Бар',
      responsible: 'Сидоров С.',
      sku: 'DAIRY-004',
      name: 'Сливки 33%',
      category: 'Молочные',
      qty: 12,
      unit: 'л',
      price: 155,
      expiry: '2025-10-01',
      supplier: 'МолКомбинат',
      status: 'danger',
    },
  ];

  private readonly rowsSignal = signal<SupplyRow[]>(structuredClone(this.initialRows));

  readonly list = () => this.rowsSignal.asReadonly();

  addRow(row: Omit<SupplyRow, 'id'>): void {
    this.rowsSignal.update((rows) => {
      const nextId = rows.reduce((max, current) => Math.max(max, current.id), 0) + 1;
      return [...rows, { id: nextId, ...row }];
    });
  }

  updateRow(updatedRow: SupplyRow): void {
    this.rowsSignal.update((rows) =>
      rows.map((row) => (row.id === updatedRow.id ? { ...updatedRow } : row)),
    );
  }

  removeRowsById(ids: readonly number[]): void {
    const idSet = new Set(ids);
    this.rowsSignal.update((rows) => rows.filter((row) => !idSet.has(row.id)));
  }

  reset(): void {
    this.rowsSignal.set(structuredClone(this.initialRows));
  }
}

function getTableRows(nativeElement: HTMLElement): HTMLTableRowElement[] {
  return Array.from(nativeElement.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
}

describe('WarehousePageComponent', () => {
  let fixture: ComponentFixture<WarehousePageComponent>;
  let component: WarehousePageComponent;
  let service: InMemoryWarehouseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehousePageComponent],
      providers: [
        InMemoryWarehouseService,
        {
          provide: WarehouseService,
          useExisting: InMemoryWarehouseService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WarehousePageComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(InMemoryWarehouseService);
    service.reset();
    fixture.detectChanges();
  });

  it('filters rows by search query', () => {
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'MEAT-001';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const rows = getTableRows(fixture.nativeElement);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('MEAT-001');
  });

  it('filters rows by status', () => {
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    const statusSelect = selects[0];
    statusSelect.value = 'warning';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = getTableRows(fixture.nativeElement);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Скоро срок');
  });

  it('filters rows by warehouse', () => {
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    const warehouseSelect = selects[2];
    warehouseSelect.value = 'Кухня';
    warehouseSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = getTableRows(fixture.nativeElement);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Кухня');
  });

  it('filters rows by arrival date range', () => {
    const dateInputs = fixture.nativeElement.querySelectorAll(
      '.warehouse-page__filters input[type="date"]',
    ) as NodeListOf<HTMLInputElement>;
    const from = dateInputs[0];
    const to = dateInputs[1];

    from.value = '2025-09-27';
    from.dispatchEvent(new Event('change'));
    to.value = '2025-09-27';
    to.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = getTableRows(fixture.nativeElement);
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('27.09.2025');
  });

  it('shows row sum calculated from qty and price', () => {
    const firstRow = service.list()()[0];
    service.updateRow({ ...firstRow, qty: 10, price: 20 });
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = firstRow.docNo;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const [tableRow] = getTableRows(fixture.nativeElement);
    const sumCell = tableRow.querySelectorAll('td')[10];
    const text = sumCell?.textContent?.replace(/ /g, ' ').trim();
    expect(text).toBe('200 ₽');
  });

  it('computes total sum for filtered rows', () => {
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    const statusSelect = selects[0];
    statusSelect.value = 'ok';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const expected = component
      .filteredRows()
      .reduce((total, row) => total + row.qty * row.price, 0);
    expect(component.totalSum()).toBe(expected);
  });

  it('selects and clears all rows via header checkbox', () => {
    const headerCheckbox = fixture.nativeElement.querySelector(
      'thead input[type="checkbox"]',
    ) as HTMLInputElement;

    headerCheckbox.click();
    fixture.detectChanges();
    expect(component.checkedIds().length).toBe(component.filteredRows().length);

    headerCheckbox.click();
    fixture.detectChanges();
    expect(component.checkedIds().length).toBe(0);
  });

  it('opens drawer on row double click', () => {
    const [row] = getTableRows(fixture.nativeElement);
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('.warehouse-page__drawer') as HTMLElement;
    expect(drawer).toBeTruthy();
    expect(drawer.textContent).toContain(component.filteredRows()[0].docNo);
  });

  it('removes a single row after delete confirmation', () => {
    const initialRows = getTableRows(fixture.nativeElement).length;
    const menuButton = fixture.nativeElement.querySelector(
      '.warehouse-page__row-menu-trigger',
    ) as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      '.warehouse-page__row-menu-panel button:last-child',
    ) as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector(
      '.warehouse-page__dialog--confirm .btn-danger',
    ) as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();

    expect(getTableRows(fixture.nativeElement).length).toBe(initialRows - 1);
  });

  it('removes all selected rows using bulk action', () => {
    const headerCheckbox = fixture.nativeElement.querySelector(
      'thead input[type="checkbox"]',
    ) as HTMLInputElement;
    headerCheckbox.click();
    fixture.detectChanges();

    const bulkDeleteButton = fixture.nativeElement.querySelector(
      '.warehouse-page__bulk-actions .btn-danger',
    ) as HTMLButtonElement;
    bulkDeleteButton.click();
    fixture.detectChanges();

    const confirmButton = fixture.nativeElement.querySelector(
      '.warehouse-page__dialog--confirm .btn-danger',
    ) as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();

    expect(component.rows().length).toBe(0);
    expect(component.checkedIds().length).toBe(0);
    const emptyRow = fixture.nativeElement.querySelector('.warehouse-page__empty-row');
    expect(emptyRow?.textContent).toContain('Нет поставок');
  });
});
