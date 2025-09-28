import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { SupplyRow } from './models';
import { WarehouseService } from './warehouse.service';
import { FieldComponent } from './ui/field.component';
import { MetricComponent } from './ui/metric.component';
import { EmptyStateComponent } from './ui/empty-state.component';

@Component({
  standalone: true,
  selector: 'app-warehouse-page',
  imports: [
    NgFor,
    NgIf,
    MetricComponent,
    FieldComponent,
    EmptyStateComponent,
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
  readonly drawerOpen = signal(false);
  readonly dialogOpen = signal(false);
  readonly selectedRow = signal<SupplyRow | null>(null);

  readonly rows = this.warehouseService.list();

  readonly tabKeys = ['supplies', 'stock', 'catalog', 'inventory'] as const;

  readonly suppliers = computed(() => {
    const unique = new Set(this.rows().map((row) => row.supplier));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

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

  readonly allRowsChecked = computed(
    () =>
      this.filteredRows().length > 0 &&
      this.selectedRows().length === this.filteredRows().length,
  );

  readonly hasSelection = computed(() => this.selectedRows().length > 0);

  constructor(private readonly warehouseService: WarehouseService) {}

  readonly tabLabels: Record<'supplies' | 'stock' | 'catalog' | 'inventory', string> = {
    supplies: 'Поставки',
    stock: 'Остатки',
    catalog: 'Каталог',
    inventory: 'Инвентаризация',
  };

  trackByRow = (_: number, row: SupplyRow) => row.id;

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

  openDrawer(row: SupplyRow): void {
    this.selectedRow.set(row);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedRow.set(null);
  }

  openDialog(): void {
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
}
