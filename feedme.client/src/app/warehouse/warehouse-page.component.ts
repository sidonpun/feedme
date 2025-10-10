import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
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

import { SupplyRow, SupplyStatus, SUPPLY_STATUSES } from './models';
import { InventoryComponent } from './inventory/inventory.component';
import { WarehouseService } from './warehouse.service';
import { EmptyStateComponent } from './ui/empty-state.component';
import { FieldComponent } from './ui/field.component';
import { StatusBadgeClassPipe } from '../pipes/status-badge-class.pipe';
import { StatusBadgeLabelPipe } from '../pipes/status-badge-label.pipe';
import { CatalogComponent as LegacyCatalogComponent } from '../components/catalog/catalog.component';
import { CreateSupplyDialogComponent, CreateSupplyDialogResult } from './ui/create-supply-dialog.component';
import { computeExpiryStatus } from './shared/status.util';

const RUB_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

type EditDialogTab = 'details' | 'items' | 'history';

type WarehouseTab = 'supplies' | 'stock' | 'catalog' | 'inventory';

type SupplyHistoryEntry = {
  date: string;
  operation: 'Приход' | 'Списание' | 'Перемещение';
  quantity: string;
};

type PrimaryAction = {
  readonly label: string;
  readonly aria: string;
  readonly cssClass: string;
};

@Component({
  standalone: true,
  selector: 'app-warehouse-page',
  imports: [
    NgFor,
    NgIf,
    NgClass,
    ReactiveFormsModule,
    FieldComponent,
    EmptyStateComponent,
    StatusBadgeClassPipe,
    StatusBadgeLabelPipe,
    LegacyCatalogComponent,
    CreateSupplyDialogComponent,
  ],
  templateUrl: './warehouse-page.component.html',
  styleUrl: './warehouse-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehousePageComponent {
  private readonly warehouseService = inject(WarehouseService);
  private readonly fb = inject(NonNullableFormBuilder);

  @ViewChild(LegacyCatalogComponent)
  private catalogComponent?: LegacyCatalogComponent;

  @ViewChild(InventoryComponent)
  private inventoryComponent?: InventoryComponent;


  readonly activeTab = signal<'supplies' | 'stock' | 'catalog' | 'inventory'>('supplies');

  readonly selectedWarehouse = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly searchState = signal<Record<WarehouseTab, string>>({
    supplies: '',
    stock: '',
    catalog: '',
    inventory: '',
  });
  readonly search = computed(() => this.searchState()[this.activeTab()]);
  readonly checkedIds = signal<string[]>([]);
  readonly drawerRowId = signal<string | null>(null);
  readonly drawerOpen = signal(false);
  readonly editDialogOpen = signal(false);
  readonly createDialogOpen = signal(false);
  readonly deleteDialogOpen = signal(false);
  readonly editingRowId = signal<string | null>(null);
  readonly deleteTargetIds = signal<string[]>([]);
  readonly menuRowId = signal<string | null>(null);
  readonly editDialogTab = signal<EditDialogTab>('details');

  readonly rows = this.warehouseService.list();
  readonly metrics = this.warehouseService.metrics();
  readonly overviewMetrics = computed(() =>
    this.warehouseService.metricsForWarehouse(this.selectedWarehouse() || null),
  );


  readonly primaryAction = computed<PrimaryAction | null>(() => {
    switch (this.activeTab()) {
      case 'supplies':
        return {
          label: '+ \u041d\u043e\u0432\u0430\u044f \u043f\u043e\u0441\u0442\u0430\u0432\u043a\u0430',
          aria: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043d\u043e\u0432\u0443\u044e \u043f\u043e\u0441\u0442\u0430\u0432\u043a\u0443',
          cssClass: 'btn--accent',
        };
      case 'catalog':
        return {
          label: '+ \u041d\u043e\u0432\u044b\u0439 \u0442\u043e\u0432\u0430\u0440',
          aria: '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043d\u043e\u0432\u044b\u0439 \u0442\u043e\u0432\u0430\u0440 \u0432 \u043a\u0430\u0442\u0430\u043b\u043e\u0433',
          cssClass: 'btn--primary',
        };
      case 'inventory':
        return {
          label: '+ \u0418\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u0438\u0437\u0430\u0446\u0438\u044f',
          aria: '\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442 \u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440\u0438\u0437\u0430\u0446\u0438\u0438',
          cssClass: 'btn--primary',
        };
      default:
        return null;
    }
  });


  readonly editDialogTabs: ReadonlyArray<{ key: EditDialogTab; label: string }> = [
    { key: 'details', label: 'Документ' },
    { key: 'items', label: 'Позиции' },
    { key: 'history', label: 'История' },
  ];

  readonly editDialogHistory: ReadonlyArray<SupplyHistoryEntry> = [
    { date: '12.03.2025 14:20', operation: 'Приход', quantity: '+24 кг' },
    { date: '14.03.2025 09:10', operation: 'Перемещение', quantity: '−6 кг' },
    { date: '15.03.2025 18:45', operation: 'Списание', quantity: '−2 кг' },
    { date: '18.03.2025 11:05', operation: 'Приход', quantity: '+18 кг' },
  ];

  readonly statuses = SUPPLY_STATUSES;


  readonly warehouses = computed(() =>
    Array.from(new Set(this.rows().map((row) => row.warehouse))).sort((a, b) => {
      if (a === b) {
        return 0;
      }
      if (a === 'Главный склад') {
        return -1;
      }
      if (b === 'Главный склад') {
        return 1;
      }

      return a.localeCompare(b);
    }),
  );

  readonly filteredRows = computed(() => {
    const warehouseFilter = this.selectedWarehouse();
    const from = this.dateFrom();
    const to = this.dateTo();
    const query = this.searchState().supplies.trim().toLowerCase();

    const filtered = this.rows().filter((row) => {
      const matchesWarehouse = warehouseFilter ? row.warehouse === warehouseFilter : true;
      const matchesFrom = from ? row.arrivalDate >= from : true;
      const matchesTo = to ? row.arrivalDate <= to : true;
      const matchesQuery = query
        ? [row.docNo, row.sku, row.name, row.responsible]
            .map((value) => value.toLowerCase())
            .some((value) => value.includes(query))
        : true;

      return (
        matchesWarehouse &&
        matchesFrom &&
        matchesTo &&
        matchesQuery
      );
    });

    return this.sortRowsByRecency(filtered);
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
      const availableWarehouses = this.warehouses();
      if (!availableWarehouses.length) {
        this.selectedWarehouse.set('');
        return;
      }

      const current = this.selectedWarehouse();
      if (!current || !availableWarehouses.includes(current)) {
        this.selectedWarehouse.set(availableWarehouses[0]);
      }
    });

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

  trackByRow = (_: number, row: SupplyRow) => row.id;
  trackByEditDialogTab = (_: number, tab: { key: EditDialogTab }) => tab.key;
  trackByHistoryEntry = (_: number, entry: SupplyHistoryEntry) => `${entry.date}-${entry.operation}-${entry.quantity}`;

  selectEditDialogTab(tab: EditDialogTab): void {
    this.editDialogTab.set(tab);
  }

  selectTab(tab: WarehouseTab): void {
    this.activeTab.set(tab);
  }

  handlePrimaryAction(): void {
    const active = this.activeTab();

    if (active === 'supplies') {
      this.openCreateDialog();
      return;
    }

    if (active === 'inventory') {
      this.inventoryComponent?.openCreateDialog();
      return;
    }

    if (active === 'catalog') {
      this.catalogComponent?.openNewProductPopup();
    }
  }
  selectWarehouse(value: string): void {
    this.selectedWarehouse.set(value);
  }

  updateSearch(value: string): void {
    const activeTab = this.activeTab();
    this.searchState.update((state) => {
      if (state[activeTab] === value) {
        return state;
      }

      return {
        ...state,
        [activeTab]: value,
      };
    });
  }

  updateDateFrom(value: string): void {
    this.dateFrom.set(value);
  }

  updateDateTo(value: string): void {
    this.dateTo.set(value);
  }

  clearFilters(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.updateSearch('');
  }

  toggleRowSelection(id: string, checked: boolean): void {
    const selection = new Set(this.checkedIds());
    if (checked) {
      selection.add(id);
    } else {
      selection.delete(id);
    }
    this.checkedIds.set(Array.from(selection).sort((left, right) => left.localeCompare(right)));
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

  handleRowCheckbox(id: string, event: Event): void {
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

  toggleRowMenu(rowId: string, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.menuRowId();
    this.menuRowId.set(current === rowId ? null : rowId);
  }

  openCreateDialog(): void {
    this.createDialogOpen.set(true);
    this.menuRowId.set(null);
  }

  closeCreateDialog(): void {
    this.createDialogOpen.set(false);
  }

  async handleCreateSupply(result: CreateSupplyDialogResult): Promise<void> {
    const product = result.product;
    const docNo = this.generateDocumentNumber();
    const warehouse = this.normalizeWarehouse(
      this.selectedWarehouse() || this.warehouses()[0] || 'Главный склад',
    );
    const responsible = 'Не назначен';
    const supplier = this.normalizeText(product.supplierMain, 'Не указан');
    const category = this.normalizeText(product.category, 'Без категории');
    const unit = this.normalizeUnit(product.unit);
    const price = Number(product.purchasePrice ?? 0);
    const status = this.mapExpiryStatus(result.arrivalDate, result.expiryDate);
    const arrivalDate = result.arrivalDate.trim();
    const expiryDate = result.expiryDate.trim();
    const name = this.normalizeText(product.name, 'Без названия');
    const sku = this.normalizeText(product.sku, '—');

    const payload = {
      docNo,
      arrivalDate,
      warehouse,
      responsible,
      supplier,
      productId: product.id,
      sku,
      name,
      category,
      qty: Number(result.quantity),
      unit,
      price,
      expiry: expiryDate,
      status,
    };

    const created = await this.warehouseService.addRow(payload);
    this.selectedWarehouse.set(created.warehouse);
    this.createDialogOpen.set(false);
  }

  private normalizeWarehouse(value: string): string {
    const normalized = value.trim();
    return normalized || 'Главный склад';
  }

  private generateDocumentNumber(): string {
    const rows = this.rows();
    const highest = rows.reduce((max, row) => {
      const match = /PO-(\d+)$/.exec(row.docNo);
      if (!match) {
        return max;
      }

      const number = Number.parseInt(match[1], 10);
      return Number.isNaN(number) ? max : Math.max(max, number);
    }, 0);

    const next = highest + 1;
    return `PO-${String(next).padStart(6, '0')}`;
  }

  private mapExpiryStatus(arrival: string, expiry: string): SupplyStatus {
    const status = computeExpiryStatus(expiry, arrival);
    if (status === 'warning') {
      return 'warning';
    }
    if (status === 'expired') {
      return 'expired';
    }
    return 'ok';
  }

  private normalizeText(value: string | null | undefined, fallback: string): string {
    const normalized = value?.trim();
    return normalized && normalized.length > 0 ? normalized : fallback;
  }

  private normalizeUnit(unit: string | null | undefined): string {
    return this.normalizeText(unit, 'шт');
  }

  startEdit(row: SupplyRow): void {
    this.populateEditForm(row);
    this.clearDateOrderError();
    this.editingRowId.set(row.id);
    this.editDialogOpen.set(true);
    this.menuRowId.set(null);
    this.editDialogTab.set('details');
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
    this.editDialogTab.set('details');
  }

  async submitEdit(): Promise<void> {
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
    };

    const editingId = this.editingRowId();
    if (editingId === null) {
      this.closeEditDialog();
      return;
    }

    const existing = this.getRowById(editingId);
    if (!existing) {
      this.closeEditDialog();
      return;
    }

    const updated: SupplyRow = {
      ...existing,
      ...base,
    };

    await this.warehouseService.updateRow(updated);

    if (this.drawerOpen() && this.drawerRowId() === updated.id) {
      this.drawerRowId.set(updated.id);
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

  async confirmDelete(): Promise<void> {
    const ids = this.deleteTargetIds();
    if (!ids.length) {
      return;
    }

    await this.warehouseService.removeRowsById(ids);
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

  getRowById(id: string): SupplyRow | undefined {
    return this.rows().find((row) => row.id === id);
  }

  private sortRowsByRecency(rows: readonly SupplyRow[]): SupplyRow[] {
    return [...rows].sort((left, right) => this.compareByRecency(left, right));
  }

  private compareByRecency(left: SupplyRow, right: SupplyRow): number {
    const arrivalComparison = this.compareIsoDatesDesc(left.arrivalDate, right.arrivalDate);
    if (arrivalComparison !== 0) {
      return arrivalComparison;
    }

    return this.compareDocNumbersDesc(left.docNo, right.docNo);
  }

  private compareIsoDatesDesc(left: string, right: string): number {
    const leftTimestamp = this.timestampFromIsoDate(left);
    const rightTimestamp = this.timestampFromIsoDate(right);

    if (leftTimestamp !== rightTimestamp) {
      return rightTimestamp - leftTimestamp;
    }

    return 0;
  }

  private timestampFromIsoDate(value: string): number {
    const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return Number.NEGATIVE_INFINITY;
    }

    return new Date(year, month - 1, day).getTime();
  }

  private compareDocNumbersDesc(left: string, right: string): number {
    const leftNumber = this.extractDocNumber(left);
    const rightNumber = this.extractDocNumber(right);

    if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
      return rightNumber - leftNumber;
    }

    return right.localeCompare(left, 'ru');
  }

  private extractDocNumber(docNo: string): number | null {
    const match = /(?<digits>\d+)$/.exec(docNo.trim());
    if (!match?.groups?.['digits']) {
      return null;
    }

    const parsed = Number.parseInt(match.groups['digits'], 10);
    return Number.isNaN(parsed) ? null : parsed;
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
