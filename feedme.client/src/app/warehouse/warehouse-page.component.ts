import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { SupplyRow, SupplyStatus } from './models';
import { WarehouseService } from './warehouse.service';
import { EmptyStateComponent } from './ui/empty-state.component';
import { StatusBadgeClassPipe } from '../pipes/status-badge-class.pipe';
import { StatusBadgeLabelPipe } from '../pipes/status-badge-label.pipe';
import { CatalogComponent as LegacyCatalogComponent } from '../components/catalog/catalog.component';
import { InventoryComponent } from './inventory/inventory.component';
import { CreateSupplyDialogComponent, CreateSupplyDialogResult } from './ui/create-supply-dialog.component';
import { SupplyTableComponent } from '../components/SupplyTableComponent/supply-table.component';
import { computeExpiryStatus } from './shared/status.util';

const RUB_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

type WarehouseTab = 'supplies' | 'stock' | 'catalog' | 'inventory';

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
    EmptyStateComponent,
    StatusBadgeClassPipe,
    StatusBadgeLabelPipe,
    LegacyCatalogComponent,
    InventoryComponent,
    SupplyTableComponent,
    CreateSupplyDialogComponent,
  ],
  templateUrl: './warehouse-page.component.html',
  styleUrl: './warehouse-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehousePageComponent {
  private readonly warehouseService = inject(WarehouseService);

  @ViewChild(LegacyCatalogComponent)
  private catalogComponent?: LegacyCatalogComponent;

  @ViewChild(InventoryComponent)
  private inventoryComponent?: InventoryComponent;

  readonly activeTab = signal<WarehouseTab>('supplies');
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
  readonly createDialogOpen = signal(false);

  readonly rows = this.warehouseService.list();
  readonly metrics = this.warehouseService.metrics();
  readonly overviewMetrics = computed(() =>
    this.warehouseService.metricsForWarehouse(this.selectedWarehouse() || null),
  );

  readonly primaryAction = computed<PrimaryAction | null>(() => {
    switch (this.activeTab()) {
      case 'supplies':
        return {
          label: '+ Новая поставка',
          aria: 'Создать новую поставку',
          cssClass: 'btn--accent',
        };
      case 'catalog':
        return {
          label: '+ Новый товар',
          aria: 'Добавить новый товар в каталог',
          cssClass: 'btn--primary',
        };
      case 'inventory':
        return {
          label: '+ Инвентаризация',
          aria: 'Создать документ инвентаризации',
          cssClass: 'btn--primary',
        };
      default:
        return null;
    }
  });

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

    return this.rows().filter((row) => {
      const matchesWarehouse = warehouseFilter ? row.warehouse === warehouseFilter : true;
      const matchesFrom = from ? row.arrivalDate >= from : true;
      const matchesTo = to ? row.arrivalDate <= to : true;
      const matchesQuery = query
        ? [row.docNo, row.sku, row.name, row.responsible]
            .map((value) => value.toLowerCase())
            .some((value) => value.includes(query))
        : true;

      return matchesWarehouse && matchesFrom && matchesTo && matchesQuery;
    });
  });

  readonly totalSum = computed(() =>
    this.filteredRows().reduce((acc, row) => acc + row.qty * row.price, 0),
  );

  readonly supplyTableData = computed(() =>
    this.filteredRows().map((row) => ({
      id: row.id,
      documentNumber: row.docNo,
      arrivalDate: row.arrivalDate,
      warehouse: row.warehouse,
      responsible: row.responsible,
      sku: row.sku,
      productName: row.name,
      category: row.category,
      quantity: row.qty,
      stock: row.qty,
      unitPrice: row.price,
      expiryDate: row.expiry,
      supplier: row.supplier,
      status: row.status,
    })),
  );

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
  }

  selectTab(tab: WarehouseTab): void {
    this.activeTab.set(tab);
  }

  selectWarehouse(value: string): void {
    this.selectedWarehouse.set(value);
  }

  updateSearch(value: string): void {
    const activeTab = this.activeTab();
    this.searchState.update((state) => ({
      ...state,
      [activeTab]: value,
    }));
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

  openCreateDialog(): void {
    this.createDialogOpen.set(true);
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

  handleSupplySettings(_row: unknown): void {}

  handleSupplyWriteOff(_row: unknown): void {}

  handleSupplyMove(_row: unknown): void {}

  handleSupplyPrint(_row: unknown): void {}

  formatCurrency(value: number): string {
    return RUB_FORMATTER.format(value);
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
}
