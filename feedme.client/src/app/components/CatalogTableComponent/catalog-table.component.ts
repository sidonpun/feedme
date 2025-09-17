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
  styleUrls: ['./catalog-table.component.css']
})
export class CatalogTableComponent implements OnChanges {
  /** Входные данные для каталога */
  @Input() data: CatalogItem[] = [];

  /** Режим отображения таблицы */
  viewMode: CatalogView = 'info';


  @Output() onAddSupply = new EventEmitter<void>();
  @Output() edit = new EventEmitter<CatalogItem>();
  @Output() deleteRow = new EventEmitter<CatalogItem>();

  /** Управление фильтрацией и пагинацией */
  searchQuery = '';
  rowsPerPage = 10;
  currentPage = 1;
  filteredData: CatalogItem[] = [];

  /** Строка, выбранная для удаления */
  deleteCandidate: CatalogItem | null = null;
  showConfirm = false;


  /** Колонки для режима "Основная информация" */
  private readonly infoColumns: CatalogColumn[] = [
    { label: 'Название товара', key: 'name' },
    { label: 'Тип номенклатуры', key: 'type' },
    { label: 'Номенклатурный код', key: 'code' },
    { label: 'Категория', key: 'category' },
    { label: 'Единица измерения (базовая)', key: 'unit' },
    { label: 'Вес/объём единицы', key: 'weight' },
    { label: 'Метод списания', key: 'writeoffMethod' },
    { label: 'Аллергены', key: 'allergens' },
    { label: 'Требует фасовки', key: 'packagingRequired' },
    { label: 'Портится после вскрытия', key: 'spoilsAfterOpening' },
  ];

  /** Колонки для режима "Закупка и логистика" */
  private readonly logisticsColumns: CatalogColumn[] = [
    { label: 'Поставщик (основной)', key: 'supplier' },
    { label: 'Срок поставки (дней)', key: 'deliveryTime' },
    { label: 'Оценочная себестоимость', key: 'costEstimate' },
    { label: 'Ставка НДС', key: 'taxRate' },
    { label: 'Цена за единицу', key: 'unitPrice' },
    { label: 'Код ТН ВЭД', key: 'tnved' },
    { label: 'Маркируемый товар', key: 'isMarked' },
    { label: 'Алкогольная продукция', key: 'isAlcohol' },
  ];

  private readonly columnsByView: Record<CatalogView, CatalogColumn[]> = {
    info: this.infoColumns,
    logistics: this.logisticsColumns,
  };


  private readonly searchableKeys: (keyof CatalogItem)[] = Array.from(
    new Set([...this.infoColumns, ...this.logisticsColumns].map(column => column.key))
  ) as (keyof CatalogItem)[];


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

    this.filteredData = matches;

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

}
