import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

type TabName = 'Поставки' | 'Остатки' | 'Каталог' | 'Инвентаризация';

interface WarehouseMetric {
  readonly title: string;
  readonly value: string;
  readonly isNegative?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly breadcrumbs: readonly string[] = ['Поставки', 'Главный склад'];
  readonly selectedWarehouse = 'Главный склад';

  readonly metrics: readonly WarehouseMetric[] = [
    { title: 'Поставок за 7 дней', value: '12' },
    { title: 'Сумма закупок / 7 дн.', value: '125 430 ₽' },
    { title: 'Позиций на складе', value: '248' },
    { title: 'Просрочено', value: '2', isNegative: true }
  ];

  readonly tabs: readonly TabName[] = ['Поставки', 'Остатки', 'Каталог', 'Инвентаризация'];
  activeTab: TabName = this.tabs[0];

  readonly searchPlaceholder = 'Поиск по номеру, SKU или названию';
  readonly datePlaceholders = { start: 'дд.мм.гггг', end: 'дд.мм.гггг' } as const;

  private readonly filterDefaults = {
    search: '',
    startDate: '',
    endDate: ''
  } as const;

  readonly filterForm = this.formBuilder.nonNullable.group({
    search: this.filterDefaults.search,
    startDate: this.filterDefaults.startDate,
    endDate: this.filterDefaults.endDate
  });

  onResetFilters(): void {
    this.filterForm.reset(this.filterDefaults);
  }

  setActiveTab(tab: TabName): void {
    this.activeTab = tab;
  }
}
