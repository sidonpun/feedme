import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDeletePopupComponent } from '../confirm-delete-popup/confirm-delete-popup.component';
import { TableControlsComponent } from '../table-controls/table-controls.component';
import { CatalogViewSwitcherComponent } from '../catalog-view-switcher/catalog-view-switcher.component';
import { CatalogItem } from '../../services/catalog.service';

type CatalogView = 'info' | 'logistics';

interface CatalogColumn {
  label: string;
  key: keyof CatalogItem;
  widthClass: string;
  headerClasses?: string[];
  cellClasses?: string[];
  sortable?: boolean;
}

interface FilterOptions {
  justAdded?: boolean;
  preservePage?: boolean;
}
@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDeletePopupComponent,
    TableControlsComponent,
    CatalogViewSwitcherComponent
  ],
  templateUrl: './catalog-table.component.html',
  styleUrls: ['./catalog-table.component.scss']
})
export class CatalogTableComponent implements OnChanges {
  /** Входные данные для каталога */
  @Input() data: CatalogItem[] = [];

  /** Режим отображения таблицы */
  viewMode: CatalogView = 'info';

  /** Идентификатор заголовка колонки действий */
  readonly actionsHeaderId = 'catalog-column-actions';


  @Output() onAddSupply = new EventEmitter<void>();
  @Output() edit = new EventEmitter<CatalogItem>();
  @Output() deleteRow = new EventEmitter<CatalogItem>();

  /** Управление фильтрацией и пагинацией */
  searchQuery = '';
  rowsPerPage = 10;
  currentPage = 1;
  filteredData: CatalogItem[] = [];

  /** Параметры сортировки */
  sort: { key: keyof CatalogItem; dir: 'asc' | 'desc' } = { key: 'name', dir: 'asc' };

  /** Строка, выбранная для удаления */
  deleteCandidate: CatalogItem | null = null;
  showConfirm = false;


  /** Колонки для режима "Основная информация" */
  private readonly infoColumns: CatalogColumn[] = [
    {
      label: 'Название товара',
      key: 'name',
      widthClass: 'w-name',
      cellClasses: ['text-clip']
    },
    {
      label: 'Тип номенклатуры',
      key: 'type',
      widthClass: 'w-type',
      cellClasses: ['text-clip']
    },
    {
      label: 'Номенклатурный код',
      key: 'code',
      widthClass: 'w-code',
      cellClasses: ['mono']
    },
    {
      label: 'Категория',
      key: 'category',
      widthClass: 'w-cat',
      cellClasses: ['text-clip']
    },
    {
      label: 'Единица измерения (базовая)',
      key: 'unit',
      widthClass: 'w-unit',
      cellClasses: ['mono']
    },
    {
      label: 'Метод списания',
      key: 'writeoffMethod',
      widthClass: 'w-method'
    },
    {
      label: 'Аллергены',
      key: 'allergens',
      widthClass: 'w-attr',
      cellClasses: ['text-clip']
    },
    {
      label: 'Флаги',
      key: 'packagingRequired',
      widthClass: 'w-flags',
      sortable: false
    },
  ];

  /** Колонки для режима "Закупка и логистика" */
  private readonly logisticsColumns: CatalogColumn[] = [
    {
      label: 'Поставщик (основной)',
      key: 'supplier',
      widthClass: 'w-supplier',
      cellClasses: ['text-clip']
    },
    {
      label: 'Оценочная себестоимость',
      key: 'costEstimate',
      widthClass: 'w-cost',
      headerClasses: ['text-right'],
      cellClasses: ['mono', 'text-right']
    },
    {
      label: 'Ставка НДС',
      key: 'taxRate',
      widthClass: 'w-tax',
      headerClasses: ['text-right'],
      cellClasses: ['mono', 'text-right']
    },
    {
      label: 'Цена за единицу',
      key: 'unitPrice',
      widthClass: 'w-price',
      headerClasses: ['text-right'],
      cellClasses: ['mono', 'text-right']
    },
    {
      label: 'Код ТН ВЭД',
      key: 'tnved',
      widthClass: 'w-tnved',
      cellClasses: ['mono']
    },
    {
      label: 'Маркируемый товар',
      key: 'isMarked',
      widthClass: 'w-flag',
      headerClasses: ['text-center'],
      cellClasses: ['text-center']
    },
    {
      label: 'Алкогольная продукция',
      key: 'isAlcohol',
      widthClass: 'w-flag',
      headerClasses: ['text-center'],
      cellClasses: ['text-center']
    },
  ];

  private readonly columnsByView: Record<CatalogView, CatalogColumn[]> = {
    info: this.infoColumns,
    logistics: this.logisticsColumns,
  };


  private readonly searchableKeys: (keyof CatalogItem)[] = [
    'name',
    'type',
    'code',
    'category',
    'unit',
    'weight',
    'writeoffMethod',
    'allergens',
    'packagingRequired',
    'spoilsAfterOpening',
    'supplier',
    'deliveryTime',
    'costEstimate',
    'taxRate',
    'unitPrice',
    'salePrice',
    'tnved',
    'isMarked',
    'isAlcohol',
    'alcoholCode',
    'alcoholStrength',
    'alcoholVolume'
  ];


  private previousLength = 0;

  /** Текущие колонки по выбранному режиму */
  get columns(): CatalogColumn[] {
    return this.columnsByView[this.viewMode];
  }

  /** Приведение значения для отображения */
  format(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
    return value ?? '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const { firstChange } = changes['data'];
      const newLength = this.data.length;
      const justAdded = !firstChange && newLength > this.previousLength;
      this.previousLength = newLength;

      this.applyFilters({
        justAdded,
        preservePage: true,
      });
    }
  }

  /** Обновление поискового запроса */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  /** Обновление количества строк на странице */
  onRowsChange(rows: number): void {
    this.rowsPerPage = rows;
    this.applyFilters();
  }

  /** Общее число страниц */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
  }

  /** Данные для текущей страницы */
  get paginatedData(): CatalogItem[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  addSupply(): void {
    this.onAddSupply.emit();
  }


  /** Выбор строки для удаления */
  requestDelete(item: CatalogItem): void {
    this.deleteCandidate = item;
    this.showConfirm = true;
  }

  /** Подтверждение удаления */
  confirmDelete(): void {
    if (this.deleteCandidate) {

      this.deleteRow.emit(this.deleteCandidate);

    }
    this.showConfirm = false;
    this.deleteCandidate = null;
  }

  cancelDelete(): void {
    this.showConfirm = false;
    this.deleteCandidate = null;
  }


  onViewChange(view: CatalogView): void {
    this.viewMode = view;
    const sortableColumns = this.columns.filter(column => column.sortable !== false);
    if (!sortableColumns.some(column => column.key === this.sort.key) && sortableColumns.length > 0) {
      this.sort = { key: sortableColumns[0].key, dir: 'asc' };
    }
    this.applyFilters({ preservePage: true });
  }

  onSort(key: keyof CatalogItem): void {
    const dir: 'asc' | 'desc' =
      this.sort.key === key && this.sort.dir === 'asc' ? 'desc' : 'asc';
    this.sort = { key, dir };
    this.applyFilters({ preservePage: true });
  }
  /** Навигация по страницам */
  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  private applyFilters(options: FilterOptions = {}): void {
    const { justAdded = false, preservePage = false } = options;
    const normalizedQuery = this.normalize(this.searchQuery);

    const nonEmptyItems = this.data.filter(item => this.hasDataForSearch(item));

    const matches = normalizedQuery
      ? nonEmptyItems.filter(item =>
          this.searchableKeys.some(key =>
            this.normalize(item[key]).includes(normalizedQuery)

          )
        )
      : nonEmptyItems;

    const activeSortKey = this.resolveSortKey();
    this.filteredData = this.sortItems(matches, activeSortKey, this.sort.dir);

    if (justAdded && !normalizedQuery) {
      this.currentPage = this.totalPages;
      return;
    }

    if (preservePage) {
      this.currentPage = Math.min(this.currentPage, this.totalPages);
      return;
    }

    this.currentPage = 1;
  }

  private normalize(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'да' : 'нет';
    }

    if (value instanceof Date) {
      return value.toISOString().toLowerCase();
    }

    return value.toString().trim().toLowerCase();
  }


  private hasDataForSearch(item: CatalogItem): boolean {
    return this.searchableKeys.some(key => this.normalize(item[key]).length > 0);
  }

  getHeaderClasses(column: CatalogColumn): string[] {
    const classes = [column.widthClass, ...(column.headerClasses ?? [])];
    if (column.sortable !== false) {
      classes.push('sortable');
      if (this.sort.key === column.key) {
        classes.push(this.sort.dir);
      }
    }
    return classes;
  }

  getCellClasses(column: CatalogColumn): string[] {
    return [column.widthClass, ...(column.cellClasses ?? [])];
  }

  /** Уникальный идентификатор заголовка для привязки ячеек */
  getHeaderId(column: CatalogColumn): string {
    return `catalog-column-${String(column.key)}`;
  }

  getFlagLabels(item: CatalogItem): string[] {
    const flags: string[] = [];
    if (item.packagingRequired) {
      flags.push('Требует фасовки');
    }
    if (item.spoilsAfterOpening) {
      flags.push('Портится после вскрытия');
    }
    return flags;
  }

  getWriteoffPillClass(method: string | null | undefined): string {
    if (!method) {
      return '';
    }
    const normalized = method.trim().toUpperCase();
    if (normalized === 'FIFO') {
      return 'pill-green';
    }
    if (normalized === 'FEFO') {
      return 'pill-blue';
    }
    return '';
  }

  private resolveSortKey(): keyof CatalogItem {
    const sortableColumns = this.columns.filter(column => column.sortable !== false);
    if (sortableColumns.length === 0) {
      return this.sort.key;
    }
    if (sortableColumns.some(column => column.key === this.sort.key)) {
      return this.sort.key;
    }
    const fallbackKey = sortableColumns[0].key;
    this.sort = { key: fallbackKey, dir: 'asc' };
    return fallbackKey;
  }

  private sortItems(items: CatalogItem[], key: keyof CatalogItem, dir: 'asc' | 'desc'): CatalogItem[] {
    const copy = [...items];
    copy.sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return dir === 'asc' ? valueA - valueB : valueB - valueA;
      }

      if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
        if (valueA === valueB) {
          return 0;
        }
        return dir === 'asc'
          ? (valueA ? 1 : -1)
          : (valueA ? -1 : 1);
      }

      const normalizedA = this.normalize(valueA);
      const normalizedB = this.normalize(valueB);
      if (normalizedA < normalizedB) {
        return dir === 'asc' ? -1 : 1;
      }
      if (normalizedA > normalizedB) {
        return dir === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return copy;
  }

}
