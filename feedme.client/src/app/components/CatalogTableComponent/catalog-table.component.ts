import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableControlsComponent } from '../table-controls/table-controls.component';
import { CatalogViewSwitcherComponent } from '../catalog-view-switcher/catalog-view-switcher.component';

import { ConfirmDeletePopupComponent } from '../confirm-delete-popup/confirm-delete-popup.component';



import { FilterPipe } from '../../pipes/filter.pipe';




@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableControlsComponent,

 
    ConfirmDeletePopupComponent

    FilterPipe,
    CatalogViewSwitcherComponent

  ],
  templateUrl: './catalog-table.component.html',
  styleUrls: ['./catalog-table.component.css']
})
export class CatalogTableComponent implements OnChanges {
  /** Входные данные для каталога */
  @Input() data: any[] = [];

  /** Режим отображения таблицы */
  viewMode: 'info' | 'logistics' = 'info';


  @Output() onAddSupply = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();


  @Output() onAddSupply = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();

 

  /** Управление фильтрацией и пагинацией */
  searchQuery: string = '';
  rowsPerPage: number = 10;
  currentPage: number = 1;

  /** Строка, выбранная для удаления */
  deleteCandidate: any | null = null;
  showConfirm = false;



  /** Колонки для режима "Основная информация" */
  readonly infoColumns = [
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
  readonly logisticsColumns = [
    { label: 'Поставщик (основной)', key: 'supplier' },
    { label: 'Срок поставки (дней)', key: 'deliveryTime' },
    { label: 'Оценочная себестоимость', key: 'costEstimate' },
    { label: 'Ставка НДС', key: 'taxRate' },
    { label: 'Цена за единицу', key: 'unitPrice' },
    { label: 'Код ТН ВЭД', key: 'tnved' },
    { label: 'Маркируемый товар', key: 'isMarked' },
    { label: 'Алкогольная продукция', key: 'isAlcohol' },
  ];

  /** Текущие колонки по выбранному режиму */
  get columns() {
    return this.viewMode === 'info' ? this.infoColumns : this.logisticsColumns;
  }

  /** Приведение значения для отображения */
  format(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
    return value ?? '';
  }

  ngOnChanges(_: SimpleChanges): void {
    this.currentPage = 1;
  }

  /** Фильтрованные данные по поисковому запросу */
  get filteredData(): any[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.data;
    return this.data.filter(item =>
      Object.values(item).some(val =>
        val && val.toString().toLowerCase().includes(q)
      )
    );
  }

  /** Обновление поискового запроса */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
  }

  /** Обновление количества строк на странице */
  onRowsChange(rows: number): void {
    this.rowsPerPage = rows;
    this.currentPage = 1;
  }

  /** Общее число страниц */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.rowsPerPage));
  }

  /** Данные для текущей страницы */
  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredData.slice(start, start + this.rowsPerPage);
  }

  addSupply(): void { this.onAddSupply.emit() }


  /** Выбор строки для удаления */
  requestDelete(item: any): void {
    this.deleteCandidate = item;
    this.showConfirm = true;
  }

  /** Подтверждение удаления */
  confirmDelete(): void {
    if (this.deleteCandidate) {
      this.remove.emit(this.deleteCandidate);
    }
    this.showConfirm = false;
    this.deleteCandidate = null;
  }

  cancelDelete(): void {
    this.showConfirm = false;
    this.deleteCandidate = null;
  }


  onViewChange(view: 'info' | 'logistics'): void {
    this.viewMode = view;
  }
  /** Навигация по страницам */
  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
}
