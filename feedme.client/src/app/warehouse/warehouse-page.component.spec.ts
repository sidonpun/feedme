import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehousePageComponent } from './warehouse-page.component';
import { WarehouseService } from './warehouse.service';
import { SupplyRow } from './models';

const TEST_ROWS: SupplyRow[] = [
  {
    id: 1,
    docNo: 'PR-100',
    arrivalDate: '2025-09-26',
    warehouse: 'Главный склад',
    responsible: 'Иванов И.',
    sku: 'MEAT-001',
    name: 'Курица',
    category: 'Мясо',
    qty: 10,
    unit: 'кг',
    price: 20,
    expiry: '2025-10-05',
    supplier: 'ООО Куры',
    status: 'ok',
  },
  {
    id: 2,
    docNo: 'PR-101',
    arrivalDate: '2025-09-26',
    warehouse: 'Кухня',
    responsible: 'Петров П.',
    sku: 'MEAT-002',
    name: 'Говядина',
    category: 'Мясо',
    qty: 5,
    unit: 'кг',
    price: 30,
    expiry: '2025-09-30',
    supplier: 'Ферма №5',
    status: 'warning',
  },
  {
    id: 3,
    docNo: 'PR-102',
    arrivalDate: '2025-09-27',
    warehouse: 'Главный склад',
    responsible: 'Сидорова А.',
    sku: 'FISH-001',
    name: 'Форель охлаждённая',
    category: 'Рыба',
    qty: 3,
    unit: 'кг',
    price: 90,
    expiry: '2025-10-02',
    supplier: 'Морепродукты',
    status: 'danger',
  },
  {
    id: 4,
    docNo: 'PR-103',
    arrivalDate: '2025-09-28',
    warehouse: 'Бар',
    responsible: 'Сергеев Д.',
    sku: 'BAR-001',
    name: 'Лимон',
    category: 'Фрукты',
    qty: 20,
    unit: 'шт',
    price: 5,
    expiry: '2025-10-15',
    supplier: 'ФруктСнаб',
    status: 'ok',
  },
];

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

describe('WarehousePageComponent', () => {
  let fixture: ComponentFixture<WarehousePageComponent>;
  let service: WarehouseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehousePageComponent],
    }).compileComponents();

    service = TestBed.inject(WarehouseService);
    service.load(TEST_ROWS);

    fixture = TestBed.createComponent(WarehousePageComponent);
    fixture.detectChanges();
  });

  function getTableRows(): NodeListOf<HTMLTableRowElement> {
    return fixture.nativeElement.querySelectorAll('tbody tr');
  }

  it('filters rows by search query', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-search"]',
    );
    input.value = 'MEAT-001';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const rows = getTableRows();
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('PR-100');
  });

  it('filters rows by status', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-status-filter"]',
    );
    select.value = 'warning';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = getTableRows();
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('PR-101');
  });

  it('filters rows by warehouse', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-warehouse-filter"]',
    );
    select.value = 'Кухня';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = getTableRows();
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('PR-101');
  });

  it('filters rows by date range', () => {
    const from: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-date-from"]',
    );
    const to: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-date-to"]',
    );

    from.value = '2025-09-27';
    from.dispatchEvent(new Event('change'));
    to.value = '2025-09-27';
    to.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rows = getTableRows();
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('PR-102');
  });

  it('displays calculated row sum using Intl number format', () => {
    const sumCell: HTMLElement | null = fixture.nativeElement.querySelector('[data-testid="sum-1"]');
    expect(sumCell).not.toBeNull();
    expect(sumCell!.textContent?.trim()).toBe(currencyFormatter.format(200));
  });

  it('shows total sum for filtered rows', () => {
    const expectedTotal = TEST_ROWS.reduce((acc, row) => acc + row.qty * row.price, 0);
    const summary: HTMLElement = fixture.nativeElement.querySelector('[data-testid="supplies-summary"]');
    expect(summary.textContent).toContain(currencyFormatter.format(expectedTotal));
  });

  it('toggles all rows via header checkbox', () => {
    const headerCheckbox: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-header-checkbox"]',
    );
    headerCheckbox.click();
    fixture.detectChanges();

    const rowCheckboxes: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll(
      '[data-testid="supplies-row-checkbox"]',
    );
    Array.from(rowCheckboxes).forEach((checkbox) => expect(checkbox.checked).toBeTrue());

    headerCheckbox.click();
    fixture.detectChanges();
    Array.from(rowCheckboxes).forEach((checkbox) => expect(checkbox.checked).toBeFalse());
  });

  it('opens drawer on double click', () => {
    const firstRow = getTableRows()[0];
    firstRow.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('.warehouse-page__drawer');
    expect(drawer).not.toBeNull();
    expect(drawer.textContent).toContain('PR-100');
  });

  it('deletes a single row via row menu', () => {
    const menuButton: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="row-menu-1"]');
    menuButton.click();
    fixture.detectChanges();

    const deleteAction: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="row-menu-delete-1"]');
    deleteAction.click();
    fixture.detectChanges();

    const confirmButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.warehouse-page__dialog--confirm .btn.btn-danger',
    );
    confirmButton.click();
    fixture.detectChanges();

    const rows = Array.from(getTableRows()).map((row) => row.textContent ?? '');
    expect(rows.some((text) => text.includes('PR-100'))).toBeFalse();
  });

  it('deletes selected rows via bulk delete', () => {
    const headerCheckbox: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="supplies-header-checkbox"]',
    );
    headerCheckbox.click();
    fixture.detectChanges();

    const bulkDelete: HTMLButtonElement = fixture.nativeElement.querySelector('[data-testid="bulk-delete"]');
    bulkDelete.click();
    fixture.detectChanges();

    const confirmButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.warehouse-page__dialog--confirm .btn.btn-danger',
    );
    confirmButton.click();
    fixture.detectChanges();

    expect(getTableRows().length).toBe(0);
    const bulkCount = fixture.nativeElement.querySelector('.warehouse-page__bulk-count');
    expect(bulkCount).toBeNull();
  });
});
