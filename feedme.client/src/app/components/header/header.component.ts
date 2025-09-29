import { CommonModule } from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { WarehouseService } from '../../warehouse/warehouse.service';

type TabName = 'Поставки' | 'Остатки' | 'Каталог' | 'Инвентаризация';

type MetricFormat = 'number' | 'currency';

interface WarehouseMetric {
  readonly title: string;
  readonly value: number;
  readonly format: MetricFormat;
  readonly isNegative?: boolean;
}

interface HeaderFilters {
  readonly search: string;
  readonly startDate: string;
  readonly endDate: string;
}


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly formBuilder = inject(FormBuilder);

  private readonly warehouseService = inject(WarehouseService);

  private readonly warehouseRows = this.warehouseService.list();
  private readonly warehouseMetrics = this.warehouseService.metrics();

  readonly tabs: readonly TabName[] = ['Поставки', 'Остатки', 'Каталог', 'Инвентаризация'];
  readonly activeTab = signal<TabName>(this.tabs[0]);


  readonly searchPlaceholder = 'Поиск по номеру, SKU или названию';
  readonly datePlaceholders = { start: 'дд.мм.гггг', end: 'дд.мм.гггг' } as const;


  private readonly filterDefaults: HeaderFilters = {
    search: '',
    startDate: '',
    endDate: '',
  } as const;

  readonly filterForm = this.formBuilder.nonNullable.group(this.filterDefaults);

  readonly selectedWarehouse = computed(() => {
    const rows = this.warehouseRows();
    if (rows.length === 0) {
      return '—';
    }

    const warehouses = Array.from(new Set(rows.map((row) => row.warehouse)));
    warehouses.sort((a, b) => {
      if (a === b) {
        return 0;
      }
      if (a === 'Главный склад') {
        return -1;
      }
      if (b === 'Главный склад') {
        return 1;
      }

      return a.localeCompare(b, 'ru');
    });

    return warehouses[0] ?? '—';
  });

  readonly breadcrumbs = computed(() => ['Поставки', this.selectedWarehouse()]);

  readonly metrics = computed<readonly WarehouseMetric[]>(() => {
    const snapshot = this.warehouseMetrics();
    return [
      {
        title: 'Поставок за 7 дней',
        value: snapshot.suppliesLastWeek,
        format: 'number',
      },
      {
        title: 'Сумма закупок / 7 дн.',
        value: snapshot.purchaseAmountLastWeek,
        format: 'currency',
      },
      {
        title: 'Позиций на складе',
        value: snapshot.positions,
        format: 'number',
      },
      {
        title: 'Просрочено',
        value: snapshot.expired,
        format: 'number',
        isNegative: snapshot.expired > 0,
      },
    ] satisfies readonly WarehouseMetric[];

  });

  onResetFilters(): void {
    this.filterForm.reset(this.filterDefaults);
  }

  setActiveTab(tab: TabName): void {

    this.activeTab.set(tab);

  }
}
