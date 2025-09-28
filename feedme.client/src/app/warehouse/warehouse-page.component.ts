import { NgFor, NgIf, NgSwitch, NgSwitchCase, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { ResolvedStockRow, StockStatus, SupplyRow } from './models';
import { WarehouseService } from './warehouse.service';
import { FieldComponent } from './ui/field.component';
import { MetricComponent } from './ui/metric.component';
import { EmptyStateComponent } from './ui/empty-state.component';

type DrawerEntry =
  | { readonly kind: 'supply'; readonly record: SupplyRow }
  | { readonly kind: 'stock'; readonly record: ResolvedStockRow };

@Component({
  standalone: true,
  selector: 'app-warehouse-page',
  imports: [
    NgFor,
    NgIf,
    MetricComponent,
    FieldComponent,
    EmptyStateComponent,
    NgSwitch,
    NgSwitchCase,
    NgTemplateOutlet,
  ],
  templateUrl: './warehouse-page.component.html',
  styleUrl: './warehouse-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehousePageComponent {
  readonly activeTab = signal<'supplies' | 'stock' | 'catalog' | 'inventory'>('supplies');
  readonly query = signal('');
  readonly status = signal<'ok' | 'warning' | 'danger' | ''>('');
  readonly supplier = signal('');
  readonly selectedRows = signal<number[]>([]);
  readonly dialogOpen = signal(false);
  readonly drawerEntry = signal<DrawerEntry | null>(null);
  readonly dialogContext = signal<'supply' | 'stock'>('supply');

  readonly stockQuery = signal('');
  readonly stockWarehouse = signal('');
  readonly stockExpiryFilter = signal<'7' | '14' | ''>('');

  readonly stockWarehouses = ['Главный склад', 'Кухня', 'Бар', 'Холодильник'] as const;

  readonly stockExpiryOptions: ReadonlyArray<{ readonly value: '' | '7' | '14'; readonly label: string }> = [
    { value: '', label: 'Все сроки' },
    { value: '7', label: '≤ 7 дней' },
    { value: '14', label: '≤ 14 дней' },
  ];

  readonly rows = this.warehouseService.list();
  readonly stockRows = this.warehouseService.listStock();

  readonly tabKeys = ['supplies', 'stock', 'catalog', 'inventory'] as const;

  readonly suppliers = computed(() => {
    const unique = new Set(this.rows().map((row) => row.supplier));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

  readonly resolvedStockRows = computed<ResolvedStockRow[]>(() =>
    this.stockRows().map((row) => {
      const daysToExpiry = this.calculateDaysToExpiry(row.expiryDate);
      return {
        ...row,
        daysToExpiry,
        expiryStatus: this.resolveExpiryStatus(daysToExpiry),
      } satisfies ResolvedStockRow;
    }),
  );

  readonly filteredRows = computed(() => {
    const search = this.query().trim().toLowerCase();
    const statusFilter = this.status();
    const supplierFilter = this.supplier();

    return this.rows().filter((row) => {
      const matchesSearch = search
        ? `${row.name}${row.sku}`.toLowerCase().includes(search)
        : true;
      const matchesStatus = statusFilter ? row.status === statusFilter : true;
      const matchesSupplier = supplierFilter ? row.supplier === supplierFilter : true;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  });

  readonly filteredStockRows = computed(() => {
    const search = this.stockQuery().trim().toLowerCase();
    const warehouseFilter = this.stockWarehouse();
    const expiryFilter = this.stockExpiryFilter();

    const filtered = this.resolvedStockRows().filter((row) => {
      const matchesSearch = search
        ? `${row.sku} ${row.name} ${row.category}`.toLowerCase().includes(search)
        : true;
      const matchesWarehouse = warehouseFilter ? row.warehouse === warehouseFilter : true;
      const matchesExpiry =
        expiryFilter === '7'
          ? row.daysToExpiry <= 7
          : expiryFilter === '14'
            ? row.daysToExpiry <= 14
            : true;

      return matchesSearch && matchesWarehouse && matchesExpiry;
    });

    return [...filtered].sort((a, b) => {
      if (a.daysToExpiry !== b.daysToExpiry) {
        return a.daysToExpiry - b.daysToExpiry;
      }
      return a.sku.localeCompare(b.sku);
    });
  });

  readonly allRowsChecked = computed(
    () =>
      this.filteredRows().length > 0 &&
      this.selectedRows().length === this.filteredRows().length,
  );

  readonly hasSelection = computed(() => this.selectedRows().length > 0);
  readonly hasStockRows = computed(() => this.filteredStockRows().length > 0);
  readonly stockQuantityTotal = computed(() =>
    this.filteredStockRows().reduce((total, row) => total + row.quantity, 0),
  );

  constructor(private readonly warehouseService: WarehouseService) {}

  readonly tabLabels: Record<'supplies' | 'stock' | 'catalog' | 'inventory', string> = {
    supplies: 'Поставки',
    stock: 'Остатки',
    catalog: 'Каталог',
    inventory: 'Инвентаризация',
  };

  trackByRow = (_: number, row: SupplyRow) => row.id;
  trackByStockRow = (_: number, row: ResolvedStockRow) => row.id;

  toggleRowSelection(id: number, checked: boolean): void {
    const selection = new Set(this.selectedRows());
    if (checked) {
      selection.add(id);
    } else {
      selection.delete(id);
    }
    this.selectedRows.set(Array.from(selection).sort((a, b) => a - b));
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selectedRows.set(this.filteredRows().map((row) => row.id));
      return;
    }
    this.selectedRows.set([]);
  }

  toggleAllFromEvent(event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;
    this.toggleAll(checkbox?.checked ?? false);
  }

  openSupplyDrawer(row: SupplyRow): void {
    this.drawerEntry.set({ kind: 'supply', record: row });
  }

  openStockDrawer(row: ResolvedStockRow): void {
    this.drawerEntry.set({ kind: 'stock', record: row });
  }

  closeDrawer(): void {
    this.drawerEntry.set(null);
  }

  openDialog(): void {
    this.dialogContext.set('supply');
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
  }

  clearFilters(): void {
    this.query.set('');
    this.status.set('');
    this.supplier.set('');
  }

  clearStockFilters(): void {
    this.stockQuery.set('');
    this.stockWarehouse.set('');
    this.stockExpiryFilter.set('');
  }

  selectTab(tab: 'supplies' | 'stock' | 'catalog' | 'inventory'): void {
    this.activeTab.set(tab);
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

  handleRowSelection(id: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement | null;
    this.toggleRowSelection(id, checkbox?.checked ?? false);
  }

  handleStockSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.stockQuery.set(input?.value ?? '');
  }

  handleStockWarehouseChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.stockWarehouse.set(select?.value ?? '');
  }

  handleStockExpiryChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    const value = select?.value ?? '';
    if (value === '7' || value === '14') {
      this.stockExpiryFilter.set(value);
      return;
    }
    this.stockExpiryFilter.set('');
  }

  handleStockRowKeydown(row: ResolvedStockRow, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openStockDrawer(row);
    }
  }

  exportStock(): void {
    const headers = [
      'SKU',
      'Название',
      'Категория',
      'Склад',
      'Количество',
      'Срок годности',
      'Поставщик (осн.)',
      'Статус срока годности',
      'Дней до окончания',
    ];

    const rows = this.filteredStockRows();
    const csvLines = rows.map((row) =>
      [
        row.sku,
        row.name,
        row.category,
        row.warehouse,
        `${row.quantity} ${row.unit}`,
        row.expiryDate,
        row.primarySupplier,
        this.getStatusLabel(row.expiryStatus),
        String(row.daysToExpiry),
      ]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(';'),
    );

    const csvContent = [headers.join(';'), ...csvLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stock-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  handleAddStock(): void {
    this.dialogContext.set('stock');
    this.dialogOpen.set(true);
  }

  private calculateDaysToExpiry(expiryDate: string): number {
    const [year, month, day] = expiryDate.split('-').map(Number);
    const target = new Date(year, (month ?? 1) - 1, day ?? 1);
    target.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = target.getTime() - today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private resolveExpiryStatus(daysToExpiry: number): StockStatus {
    if (daysToExpiry < 0) {
      return 'danger';
    }
    if (daysToExpiry <= 14) {
      return 'warning';
    }
    return 'ok';
  }

  private getStatusLabel(status: StockStatus): string {
    switch (status) {
      case 'ok':
        return 'В норме';
      case 'warning':
        return 'Скоро срок';
      case 'danger':
        return 'Просрочено';
      default:
        return '';
    }
  }
}
