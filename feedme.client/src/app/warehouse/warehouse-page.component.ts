import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { SupplyRow, SupplyStatus } from './models';
import { WarehouseService } from './warehouse.service';
import { FieldComponent } from './ui/field.component';
import { MetricComponent } from './ui/metric.component';
import { WarehouseEmptyStateComponent } from './components/empty-state/empty-state.component';

const RUB_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

@Component({
  standalone: true,
  selector: 'app-warehouse-page',
  imports: [
    NgFor,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    MetricComponent,
    FieldComponent,
    WarehouseEmptyStateComponent,
  ],
  templateUrl: './warehouse-page.component.html',
  styleUrl: './warehouse-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehousePageComponent {
  private readonly warehouseService = inject(WarehouseService);
  private readonly fb = inject(NonNullableFormBuilder);

  @ViewChild('searchInput') private readonly searchInput?: ElementRef<HTMLInputElement>;

  readonly activeTab = signal<'supplies' | 'stock' | 'catalog' | 'inventory'>('supplies');
  readonly query = signal('');
  readonly status = signal<SupplyStatus | ''>('');
  readonly supplier = signal('');
  readonly warehouseFilter = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly checkedIds = signal<number[]>([]);
  readonly drawerRowId = signal<number | null>(null);
  readonly drawerOpen = signal(false);
  readonly editDialogOpen = signal(false);
  readonly deleteDialogOpen = signal(false);
  readonly editingRowId = signal<number | null>(null);
  readonly deleteTargetIds = signal<number[]>([]);
  readonly menuRowId = signal<number | null>(null);

  readonly rows = this.warehouseService.list();

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
    const warehouseFilter = this.warehouseFilter();
    const from = this.dateFrom();
    const to = this.dateTo();

    return this.rows().filter((row) => {
      const matchesQuery = search
        ? `${row.docNo}${row.name}${row.sku}`.toLowerCase().includes(search)
        : true;
      const matchesStatus = statusFilter ? row.status === statusFilter : true;
      const matchesSupplier = supplierFilter ? row.supplier === supplierFilter : true;
      const matchesWarehouse = warehouseFilter ? row.warehouse === warehouseFilter : true;
      const matchesFrom = from ? row.arrivalDate >= from : true;
      const matchesTo = to ? row.arrivalDate <= to : true;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesSupplier &&
        matchesWarehouse &&
        matchesFrom &&
        matchesTo
      );
    });
  });

  readonly totalSum = computed(() =>
    this.filteredRows().reduce((acc, row) => acc + row.qty * row.price, 0),
  );

  readonly hasSelection = computed(() => this.checkedIds().length > 0);

  readonly allFilteredChecked = computed(() => {
    const filtered = this.filteredRows();
    if (!filtered.length) {
      return false;
    }
    const selected = new Set(this.checkedIds());
    return filtered.every((row) => selected.has(row.id));
  });

  readonly selectedRow = computed(() => {
    const id = this.drawerRowId();
    if (id === null) {
      return null;
    }
    return this.rows().find((row) => row.id === id) ?? null;
  });

  readonly tabKeys = ['supplies', 'stock', 'catalog', 'inventory'] as const;
  readonly tabLabels: Record<'supplies' | 'stock' | 'catalog' | 'inventory', string> = {
    supplies: 'Поставки',
    stock: 'Остатки',
    catalog: 'Каталог',
    inventory: 'Инвентаризация',
  };

  readonly editForm = this.fb.group({
    docNo: this.fb.control('', { validators: [Validators.required] }),
    arrivalDate: this.fb.control('', { validators: [Validators.required] }),
    warehouse: this.fb.control('', { validators: [Validators.required] }),
    responsible: this.fb.control('', { validators: [Validators.required] }),
    supplier: this.fb.control('', { validators: [Validators.required] }),
    sku: this.fb.control('', { validators: [Validators.required] }),
    name: this.fb.control('', { validators: [Validators.required] }),
    category: this.fb.control('', { validators: [Validators.required] }),
    qty: this.fb.control(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    unit: this.fb.control('', { validators: [Validators.required] }),
    price: this.fb.control(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    expiry: this.fb.control('', { validators: [Validators.required] }),
    status: this.fb.control<SupplyStatus>('ok', { validators: [Validators.required] }),
  });

  constructor() {
    effect(() => {
      const availableIds = new Set(this.rows().map((row) => row.id));
      const filteredSelection = this.checkedIds().filter((id) => availableIds.has(id));
      if (filteredSelection.length !== this.checkedIds().length) {
        this.checkedIds.set(filteredSelection);
      }

      if (this.drawerOpen() && !this.selectedRow()) {
        this.closeDrawer();
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuRowId.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === '/' && !event.defaultPrevented) {
      const input = this.searchInput?.nativeElement;
      if (input && document.activeElement !== input) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    }
  }

  trackByRow = (_: number, row: SupplyRow) => row.id;

  selectTab(tab: 'supplies' | 'stock' | 'catalog' | 'inventory'): void {
    this.activeTab.set(tab);
  }

  updateQuery(value: string): void {
    this.query.set(value);
  }

  updateStatus(value: string): void {
    if (value === 'ok' || value === 'warning' || value === 'danger') {
      this.status.set(value);
      return;
    }
    this.status.set('');
  }

  updateSupplier(value: string): void {
    this.supplier.set(value);
  }

  updateWarehouse(value: string): void {
    this.warehouseFilter.set(value);
  }

  updateDateFrom(value: string): void {
    this.dateFrom.set(value);
  }

  updateDateTo(value: string): void {
    this.dateTo.set(value);
  }

  clearFilters(): void {
    this.query.set('');
    this.status.set('');
    this.supplier.set('');
    this.warehouseFilter.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
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

  toggleAll(checked: boolean): void {
    if (checked) {
      this.checkedIds.set(this.filteredRows().map((row) => row.id));
      return;
    }
    this.checkedIds.set([]);
  }

  toggleAllFromEvent(event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;
    this.toggleAll(checkbox?.checked ?? false);
  }

  handleRowCheckbox(id: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;
    this.toggleRowSelection(id, checkbox?.checked ?? false);
  }

  openDrawer(row: SupplyRow): void {
    this.drawerRowId.set(row.id);
    this.drawerOpen.set(true);
    this.menuRowId.set(null);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.drawerRowId.set(null);
  }

  toggleRowMenu(rowId: number, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.menuRowId();
    this.menuRowId.set(current === rowId ? null : rowId);
  }

  openCreateDialog(): void {
    this.editForm.reset({
      docNo: '',
      arrivalDate: '',
      warehouse: '',
      responsible: '',
      supplier: '',
      sku: '',
      name: '',
      category: '',
      qty: 0,
      unit: '',
      price: 0,
      expiry: '',
      status: 'ok' as SupplyStatus,
    });
    this.clearDateOrderError();
    this.editingRowId.set(null);
    this.editDialogOpen.set(true);
    this.menuRowId.set(null);
  }

  startEdit(row: SupplyRow): void {
    this.populateEditForm(row);
    this.clearDateOrderError();
    this.editingRowId.set(row.id);
    this.editDialogOpen.set(true);
    this.menuRowId.set(null);
  }

  closeEditDialog(): void {
    this.editDialogOpen.set(false);
    this.editingRowId.set(null);
    this.editForm.reset({
      docNo: '',
      arrivalDate: '',
      warehouse: '',
      responsible: '',
      supplier: '',
      sku: '',
      name: '',
      category: '',
      qty: 0,
      unit: '',
      price: 0,
      expiry: '',
      status: 'ok' as SupplyStatus,
    });
    this.clearDateOrderError();
  }

  submitEdit(): void {
    this.clearDateOrderError();

    const raw = this.editForm.getRawValue();
    if (raw.arrivalDate && raw.expiry && raw.arrivalDate > raw.expiry) {
      this.setDateOrderError();
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const base = {
      docNo: raw.docNo.trim(),
      arrivalDate: raw.arrivalDate,
      warehouse: raw.warehouse.trim(),
      responsible: raw.responsible.trim(),
      supplier: raw.supplier.trim(),
      sku: raw.sku.trim(),
      name: raw.name.trim(),
      category: raw.category.trim(),
      qty: Number(raw.qty),
      unit: raw.unit.trim(),
      price: Number(raw.price),
      expiry: raw.expiry,
      status: raw.status,
    } satisfies Omit<SupplyRow, 'id'>;

    if (this.editingRowId() === null) {
      this.warehouseService.addRow(base);
    } else {
      const updated: SupplyRow = { id: this.editingRowId()!, ...base };
      this.warehouseService.updateRow(updated);

      if (this.drawerOpen() && this.drawerRowId() === updated.id) {
        this.drawerRowId.set(updated.id);
      }
    }

    this.closeEditDialog();
  }

  openDeleteDialogForRow(row: SupplyRow): void {
    this.deleteTargetIds.set([row.id]);
    this.deleteDialogOpen.set(true);
    this.menuRowId.set(null);
  }

  openDeleteDialogForSelection(): void {
    if (!this.checkedIds().length) {
      return;
    }
    this.deleteTargetIds.set([...this.checkedIds()]);
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.deleteTargetIds.set([]);
  }

  confirmDelete(): void {
    const ids = this.deleteTargetIds();
    if (!ids.length) {
      return;
    }

    this.warehouseService.removeRowsById(ids);
    const remainingSelection = this.checkedIds().filter((id) => !ids.includes(id));
    this.checkedIds.set(remainingSelection);

    if (this.drawerRowId() !== null && ids.includes(this.drawerRowId()!)) {
      this.closeDrawer();
    }

    this.closeDeleteDialog();
  }

  formatCurrency(value: number): string {
    return RUB_FORMATTER.format(value);
  }

  rowTotal(row: SupplyRow): number {
    return row.qty * row.price;
  }

  getRowById(id: number): SupplyRow | undefined {
    return this.rows().find((row) => row.id === id);
  }

  private populateEditForm(row: SupplyRow): void {
    this.editForm.setValue({
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

  private setDateOrderError(): void {
    const expiryControl = this.editForm.controls.expiry;
    const errors = { ...(expiryControl.errors ?? {}) };
    errors['dateOrder'] = true;
    expiryControl.setErrors(errors);
  }

  private clearDateOrderError(): void {
    const expiryControl = this.editForm.controls.expiry;
    const errors = { ...(expiryControl.errors ?? {}) };
    if ('dateOrder' in errors) {
      delete errors['dateOrder'];
      expiryControl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }
}
