import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CatalogRow {
  code: string;
  name: string;
  status: string;
  statusTone: 'info' | 'success' | 'warning';
  category: string;
  unit: string;
  supplier: string;
  price: number;
  lastDelivery: string;
  flags: string[];
}

type SortKey = 'code' | 'name' | 'status' | 'category' | 'unit' | 'supplier' | 'price' | 'lastDelivery';
type SortDirection = 'asc' | 'desc';

type TabKey = 'baseA' | 'baseB';

@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-table.component.html',
  styleUrls: ['./catalog-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogTableComponent {
  protected readonly baseA: CatalogRow[] = [
    {
      code: 'FM-001',
      name: 'Эспрессо микс',
      status: 'В продаже',
      statusTone: 'success',
      category: 'Кофе и напитки',
      unit: 'кг',
      supplier: 'RoastLab',
      price: 890,
      lastDelivery: '2024-02-12',
      flags: ['Новый', 'Хит продаж'],
    },
    {
      code: 'FM-014',
      name: 'Сироп карамельный',
      status: 'Ожидается',
      statusTone: 'warning',
      category: 'Сиропы и топпинги',
      unit: 'л',
      supplier: 'Sweet&Go',
      price: 410,
      lastDelivery: '2024-01-30',
      flags: ['Сезонный'],
    },
    {
      code: 'FM-023',
      name: 'Смесь для панкейков',
      status: 'В продаже',
      statusTone: 'success',
      category: 'Бекери',
      unit: 'кг',
      supplier: 'Baker Bros',
      price: 520,
      lastDelivery: '2024-02-08',
      flags: [],
    },
    {
      code: 'FM-035',
      name: 'Миндальное молоко',
      status: 'Тестируется',
      statusTone: 'info',
      category: 'Молочная продукция',
      unit: 'л',
      supplier: 'Green Field',
      price: 176,
      lastDelivery: '2023-12-22',
      flags: ['Веган'],
    },
    {
      code: 'FM-047',
      name: 'Колд брю концентрат',
      status: 'В продаже',
      statusTone: 'success',
      category: 'Кофе и напитки',
      unit: 'л',
      supplier: 'Brew Lab',
      price: 1120,
      lastDelivery: '2024-02-18',
      flags: ['Премиум'],
    },
  ];

  protected readonly baseB: CatalogRow[] = [
    {
      code: 'FM-052',
      name: 'Чиабатта замороженная',
      status: 'В продаже',
      statusTone: 'success',
      category: 'Выпечка',
      unit: 'шт',
      supplier: 'Panificio',
      price: 84,
      lastDelivery: '2024-01-27',
      flags: ['Требует разморозки'],
    },
    {
      code: 'FM-061',
      name: 'Трюфельное масло',
      status: 'Ожидается',
      statusTone: 'warning',
      category: 'Соусы и масла',
      unit: 'л',
      supplier: 'Umami Lab',
      price: 1540,
      lastDelivery: '2023-11-15',
      flags: ['Премиум'],
    },
    {
      code: 'FM-073',
      name: 'Соус терияки',
      status: 'В продаже',
      statusTone: 'success',
      category: 'Соусы и масла',
      unit: 'л',
      supplier: 'AsiaFood',
      price: 268,
      lastDelivery: '2024-02-03',
      flags: ['Популярен'],
    },
    {
      code: 'FM-088',
      name: 'Ананас консервированный',
      status: 'Тестируется',
      statusTone: 'info',
      category: 'Фрукты и ягоды',
      unit: 'кг',
      supplier: 'TropicTrade',
      price: 192,
      lastDelivery: '2024-01-19',
      flags: [],
    },
    {
      code: 'FM-095',
      name: 'Бобы какао',
      status: 'В продаже',
      statusTone: 'success',
      category: 'Кондитерское сырье',
      unit: 'кг',
      supplier: 'Choco Origin',
      price: 740,
      lastDelivery: '2024-02-11',
      flags: ['Органик'],
    },
  ];

  protected tab: TabKey = 'baseA';
  protected sortKey: SortKey = 'code';
  protected sortDirection: SortDirection = 'asc';

  protected get items(): CatalogRow[] {
    const dataset = this.tab === 'baseA' ? this.baseA : this.baseB;
    return this.sortItems([...dataset]);
  }

  protected onTabChange(tab: TabKey): void {
    if (this.tab === tab) {
      return;
    }

    this.tab = tab;
    this.sortKey = 'code';
    this.sortDirection = 'asc';
  }

  protected onSort(column: SortKey): void {
    if (this.sortKey === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortKey = column;
    this.sortDirection = 'asc';
  }

  protected sortItems(items: CatalogRow[]): CatalogRow[] {
    return items.sort((a, b) => {
      const { sortKey, sortDirection } = this;
      const left = a[sortKey];
      const right = b[sortKey];

      let comparison = 0;

      if (sortKey === 'price') {
        comparison = (left as number) - (right as number);
      } else if (sortKey === 'lastDelivery') {
        comparison = new Date(left as string).getTime() - new Date(right as string).getTime();
      } else {
        comparison = String(left).localeCompare(String(right), 'ru', {
          sensitivity: 'base',
          numeric: true,
        });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  protected sortClass(column: SortKey): Record<string, boolean> {
    return {
      sortable: true,
      'sortable--active': this.sortKey === column,
      'sortable--asc': this.sortKey === column && this.sortDirection === 'asc',
      'sortable--desc': this.sortKey === column && this.sortDirection === 'desc',
    };
  }

  protected trackByCode(_: number, item: CatalogRow): string {
    return item.code;
  }
}
