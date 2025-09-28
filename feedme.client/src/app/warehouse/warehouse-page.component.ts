import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { SupplyRow, SupplyStatus } from './models';
import { WarehouseService } from './warehouse.service';
import { FieldComponent } from './ui/field.component';
import { MetricComponent } from './ui/metric.component';
import { EmptyStateComponent } from './ui/empty-state.component';
import { RubCurrencyPipe } from './ui/rub-currency.pipe';

type DeleteDialogState = { ids: number[]; title: string } | null;

type RowMenuAction = 'open' | 'edit' | 'delete';

@Component({
  standalone: true,
  selector: 'app-warehouse-page',
  imports: [
    NgClass,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MetricComponent,
    FieldComponent,
    EmptyStateComponent,
    RubCurrencyPipe,
  ],
  templateUrl: './warehouse-page.component.html',
  styleUrl: './warehouse-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehousePageComponent {
  private readonly warehouseService = inject(WarehouseService);
  private readonly fb = inject(FormBuilder);

  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly activeTab = signal<'supplies' | 'stock' | 'catalog' | 'inventory'>('supplies');

  readonly query = signal('');
  readonly status = signal<SupplyStatus | ''>('');
  readonly supplier = signal('');
  readonly warehouse = signal('');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly checkedIds = signal<number[]>([]);
  readonly drawerRow = signal<SupplyRow | null>(null);
  readonly openedMenuId = signal<number | null>(null);
  readonly editDialogRow = signal<SupplyRow | null>(null);
  readonly deleteDialogState = signal<DeleteDialogState>(null);

  readonly rows = this.warehouseService.list();

  readonly tabKeys = ['supplies', 'stock', 'catalog', 'inventory'] as const;

  readonly suppliers = computed(() =>
    Array.from(new Set(this.rows().map((row) => row.supplier))).sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  readonly warehouses = computed(() =>
    Array.from(new Set(this.rows().map((row) => row.warehouse))).sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  readonly filteredRows = computed(() => {
    const search = this.query().trim().toLowerCase();
    const statusFilter = this.status();
    const supplierFilter = this.supplier();
    const warehouseFilter = this.warehouse();
    const from = this.dateFrom();
    const to = this.dateTo();

    return this.rows().filter((row) => {
      const matchesSearch = search
        ? `${row.docNo}${row.name}${row.sku}`.toLowerCase().includes(search)
        : true;
      const matchesStatus = statusFilter ? row.status === statusFilter : true;
      const matchesSupplier = supplierFilter ? row.supplier === supplierFilter : true;
      const matchesWarehouse = warehouseFilter ? row.warehouse === warehouseFilter : true;
      const matchesDateFrom = from ? row.arrivalDate >= from : true;
      const matchesDateTo = to ? row.arrivalDate <= to : true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSupplier &&
        matchesWarehouse &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  });

  readonly totalSum = computed(() =>
    this.filteredRows().reduce((sum, row) => sum + this.calculateRowTotal(row), 0),
  );

  readonly allRowsChecked = computed(
    () =>
      this.filteredRows().length > 0 &&
      this.filteredRows().every((row) => this.checkedIds().includes(row.id)),
  );

  readonly hasSelection = computed(() => this.checkedIds().length > 0);

  readonly tabLabels: Record<'supplies' | 'stock' | 'catalog' | 'inventory', string> = {
    supplies: 'Поставки',
    stock: 'Остатки',
    catalog: 'Каталог',
    inventory: 'Инвентаризация',
  };

  readonly editForm = this.fb.nonNullable.group(
    {
      docNo: ['', [Validators.required, Validators.maxLength(32)]],
      arrivalDate: ['', Validators.required],
      warehouse: ['', Validators.required],
      responsible: ['', [Validators.required, Validators.maxLength(64)]],
      supplier: ['', [Validators.required, Validators.maxLength(64)]],
      sku: ['', [Validators.required, Validators.maxLength(32)]],
      name: ['', [Validators.required, Validators.maxLength(128)]],
      category: ['', [Validators.required, Validators.maxLength(64)]],
      qty: [0, [Validators.required, Validators.min(0)]],
      unit: ['', [Validators.required, Validators.maxLength(16)]],
      price: [0, [Validators.required, Validators.min(0)]],
      expiry: ['', Validators.required],
      status: ['ok' as SupplyStatus | '', Validators.required],
    },
    { validators: validateDateOrder },
  );

  constructor() {
    effect(() => {
      const availableIds = new Set(this.rows().map((row) => row.id));
      const filteredIds = this.checkedIds().filter((id) => availableIds.has(id));
      if (filteredIds.length !== this.checkedIds().length) {
        this.checkedIds.set(filteredIds);
      }

      const selected = this.drawerRow();
      if (selected && !availableIds.has(selected.id)) {
        this.drawerRow.set(null);
      }
    });
  }

  trackByRow = (_: number, row: SupplyRow) => row.id;

  focusSearch(): void {
    const element = this.searchInputRef()?.nativeElement;
    element?.focus();
  }

  handleSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.query.set(input?.value ?? '');
  }

  handleStatusChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    const value = select?.value ?? '';
    if (value === 'ok' || value === 'warning' || value === 'danger') {
      this.status.set(value);
      return;
    }
    this.status.set('');
  }

  handleSupplierChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.supplier.set(select?.value ?? '');
  }

  handleWarehouseChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.warehouse.set(select?.value ?? '');
  }

  handleDateFromChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.dateFrom.set(input?.value ?? '');
  }

  handleDateToChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.dateTo.set(input?.value ?? '');
  }

  clearFilters(): void {
    this.query.set('');
    this.status.set('');
    this.supplier.set('');
    this.warehouse.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.focusSearch();
  }

  toggleRowSelection(id: number, checked: boolean): void {
    const selection = new Set(this.checkedIds());
    if (checked) {
      selection.add(id);
    } else {
      selection.delete(id);
    }
    this.checkedIds.set(Array.from(selection).sort((a, b) => a - b));
  }

  toggleAllFromEvent(event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;
    const checked = checkbox?.checked ?? false;
    if (checked) {
      this.checkedIds.set(this.filteredRows().map((row) => row.id));
      return;
    }
    this.checkedIds.set([]);
  }

  isRowChecked(id: number): boolean {
    return this.checkedIds().includes(id);
  }

  handleRowCheckboxChange(row: SupplyRow, event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;
    this.toggleRowSelection(row.id, checkbox?.checked ?? false);
  }

  handleRowDoubleClick(row: SupplyRow): void {
    this.openDrawer(row);
  }

  openDrawer(row: SupplyRow): void {
    this.drawerRow.set(row);
  }

  closeDrawer(): void {
    this.drawerRow.set(null);
  }

  toggleRowMenu(rowId: number, event: Event): void {
    event.stopPropagation();
    this.openedMenuId.set(this.openedMenuId() === rowId ? null : rowId);
  }

  closeRowMenu(): void {
    this.openedMenuId.set(null);
  }

  handleRowMenuAction(row: SupplyRow, action: RowMenuAction, event: Event): void {
    event.stopPropagation();
    this.closeRowMenu();
    if (action === 'open') {
      this.openDrawer(row);
      return;
    }
    if (action === 'edit') {
      this.openEditDialog(row);
      return;
    }
    if (action === 'delete') {
      this.openDeleteDialog([row.id], `${row.docNo} · ${row.name}`);
    }
  }

  openEditDialog(row: SupplyRow): void {
    this.editDialogRow.set(row);
    this.editForm.reset({
      docNo: row.docNo,
      arrivalDate: row.arrivalDate,
      warehouse: row.warehouse,
      responsible: row.responsible,
      supplier: row.supplier,
      sku: row.sku,
      name: row.name,
      category: row.category,
      qty: row.qty,
      unit: row.unit,
      price: row.price,
      expiry: row.expiry,
      status: row.status,
    });
  }

  closeEditDialog(): void {
    this.editDialogRow.set(null);
  }

  saveEdit(): void {
    const row = this.editDialogRow();
    if (!row) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const value = this.editForm.getRawValue();
    const updated: SupplyRow = {
      id: row.id,
      docNo: value.docNo,
      arrivalDate: value.arrivalDate,
      warehouse: value.warehouse,
      responsible: value.responsible,
      supplier: value.supplier,
      sku: value.sku,
      name: value.name,
      category: value.category,
      qty: value.qty,
      unit: value.unit,
      price: value.price,
      expiry: value.expiry,
      status: value.status as SupplyStatus,
    };
    this.warehouseService.updateRow(updated);
    this.editDialogRow.set(null);
    if (this.drawerRow()?.id === updated.id) {
      this.drawerRow.set(updated);
    }
  }

  openDeleteDialog(ids: number[], title: string): void {
    this.deleteDialogState.set({ ids, title });
  }

  openBulkDelete(): void {
    const ids = this.checkedIds();
    if (ids.length === 0) {
      return;
    }
    this.openDeleteDialog(ids, `Выбрано: ${ids.length}`);
  }

  closeDeleteDialog(): void {
    this.deleteDialogState.set(null);
  }

  confirmDelete(): void {
    const dialog = this.deleteDialogState();
    if (!dialog) {
      return;
    }
    this.warehouseService.removeRows(dialog.ids);
    this.checkedIds.set([]);
    const current = this.drawerRow();
    if (current && dialog.ids.includes(current.id)) {
      this.drawerRow.set(null);
    }
    this.deleteDialogState.set(null);
  }

  selectTab(tab: 'supplies' | 'stock' | 'catalog' | 'inventory'): void {
    this.activeTab.set(tab);
  }

  handleMassWriteOff(ids: number[] = this.checkedIds()): void {
    if (ids.length === 0) {
      return;
    }
    const snapshot = this.rows();
    ids.forEach((id) => {
      const row = snapshot.find((item) => item.id === id);
      if (row) {
        this.warehouseService.updateRow({ ...row, status: 'danger' });
      }
    });
    const drawer = this.drawerRow();
    if (drawer && ids.includes(drawer.id)) {
      const updated = this.rows().find((item) => item.id === drawer.id);
      if (updated) {
        this.drawerRow.set(updated);
      }
    }
  }

  handleMassMove(ids: number[] = this.checkedIds()): void {
    if (ids.length === 0) {
      return;
    }
    const snapshot = this.rows();
    const targetWarehouse =
      this.warehouse() || snapshot[0]?.warehouse || 'Главный склад';
    ids.forEach((id) => {
      const row = snapshot.find((item) => item.id === id);
      if (row) {
        this.warehouseService.updateRow({ ...row, warehouse: targetWarehouse });
      }
    });
    const drawer = this.drawerRow();
    if (drawer && ids.includes(drawer.id)) {
      const updated = this.rows().find((item) => item.id === drawer.id);
      if (updated) {
        this.drawerRow.set(updated);
      }
    }
  }

  handleMassPrint(ids: number[] = this.checkedIds()): void {
    if (ids.length === 0) {
      return;
    }
    const rows = this.rows().filter((row) => ids.includes(row.id));
    const content = rows
      .map(
        (row) =>
          `${row.docNo}\t${row.sku}\t${row.name}\t${row.qty} ${row.unit}\t${row.warehouse}`,
      )
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'labels.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  exportFiltered(): void {
    const header = [
      '№ док.',
      'Дата прихода',
      'Склад',
      'Ответственный',
      'SKU',
      'Название',
      'Категория',
      'Кол-во',
      'Ед.',
      'Цена',
      'Сумма',
      'Срок годности',
      'Поставщик',
      'Статус',
    ];
    const rows = this.filteredRows().map((row) => [
      row.docNo,
      row.arrivalDate,
      row.warehouse,
      row.responsible,
      row.sku,
      row.name,
      row.category,
      row.qty.toString(),
      row.unit,
      row.price.toString(),
      this.calculateRowTotal(row).toString(),
      row.expiry,
      row.supplier,
      row.status,
    ]);
    const csv = [header, ...rows]
      .map((columns) =>
        columns
          .map((value) => {
            const safe = value.replaceAll('"', '""');
            return `"${safe}"`;
          })
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supplies.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  calculateRowTotal(row: SupplyRow): number {
    return row.qty * row.price;
  }

  badgeClass(status: SupplyStatus): string {
    if (status === 'danger') {
      return 'badge badge-danger';
    }
    if (status === 'warning') {
      return 'badge badge-soft';
    }
    return 'badge';
  }

  statusLabel(status: SupplyStatus): string {
    if (status === 'danger') {
      return 'Просрочено';
    }
    if (status === 'warning') {
      return 'Скоро срок';
    }
    return 'Ок';
  }

  get deleteDialog(): DeleteDialogState {
    return this.deleteDialogState();
  }

  get editDialogVisible(): boolean {
    return this.editDialogRow() !== null;
  }

  @HostListener('window:keydown', ['$event'])
  handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === '/' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.focusSearch();
    }
  }

}

function validateDateOrder(control: AbstractControl): ValidationErrors | null {
  const arrival = control.get('arrivalDate')?.value as string | undefined;
  const expiry = control.get('expiry')?.value as string | undefined;
  if (!arrival || !expiry) {
    return null;
  }
  return arrival <= expiry ? null : { dateRange: true };
}
