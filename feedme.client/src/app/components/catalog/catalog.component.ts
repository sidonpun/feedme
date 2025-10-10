import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { NewProductFormValues } from '../catalog-new-product-popup/catalog-new-product-popup.component';
import { CatalogItem } from '../../services/catalog.service';
import { EmptyStateComponent } from '../../warehouse/ui/empty-state.component';
import { CatalogNewProductPopupComponent } from '../catalog-new-product-popup/catalog-new-product-popup.component';
import { CatalogSortState, CatalogTableComponent } from '../CatalogTableComponent/catalog-table.component';
import { catalogActions } from '../../store/catalog/catalog.actions';
import {
  selectCatalogCreationError,
  selectCatalogCreationStatus,
  selectCatalogItems,
  selectCatalogLoadError,
} from '../../store/catalog/catalog.reducer';
import { AppState } from '../../store/app.state';

const EMPTY_CATALOG: readonly CatalogItem[] = [];

type CatalogTab = 'info' | 'logistics';
type SortDirection = 'asc' | 'desc';

type SortState = {
  readonly column: number;
  readonly direction: SortDirection;
};

type SortValue = string | number | boolean;

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, CatalogNewProductPopupComponent, CatalogTableComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
  private readonly store = inject<Store<AppState>>(Store);

  activeTab: 'info' | 'logistics' = 'info';
  private readonly newProductPopupOpen = signal(false);

  private readonly infoSortAccessors: ReadonlyArray<(item: CatalogItem) => SortValue> = [
    (item) => item.name,
    (item) => item.type,
    (item) => item.code,
    (item) => item.category,
    (item) => item.unit,
    (item) => item.writeoffMethod,
    (item) => item.allergens,
    (item) => `${item.packagingRequired ? 1 : 0}-${item.spoilsAfterOpening ? 1 : 0}`,
  ];

  private readonly logisticsSortAccessors: ReadonlyArray<(item: CatalogItem) => SortValue> = [
    (item) => item.supplier,
    (item) => item.costEstimate,
    (item) => item.taxRate,
    (item) => item.unitPrice,
    (item) => item.salePrice,
    (item) => item.tnved,
    (item) => item.isMarked,
  ];

  private readonly initialSortState: Record<CatalogTab, SortState> = {
    info: { column: 0, direction: 'asc' },
    logistics: { column: 0, direction: 'asc' },
  };

  readonly isNewProductPopupVisible = this.newProductPopupOpen.asReadonly();
  private readonly catalogItems = toSignal<readonly CatalogItem[], readonly CatalogItem[]>(
    this.store.select(selectCatalogItems),
    {
      initialValue: EMPTY_CATALOG,
    }
  );
  readonly loadErrorMessage = toSignal(this.store.select(selectCatalogLoadError), {
    initialValue: null,
  });
  readonly creationErrorMessage = toSignal(this.store.select(selectCatalogCreationError), {
    initialValue: null,
  });
  private readonly creationStatus = toSignal(
    this.store.select(selectCatalogCreationStatus),
    {
      initialValue: 'idle',
    }
  );

  readonly sortState = signal<Record<CatalogTab, SortState>>({ ...this.initialSortState });

  readonly sortedInfoItems = computed(() => this.sortCatalogItems('info'));
  readonly sortedLogisticsItems = computed(() => this.sortCatalogItems('logistics'));

  private readonly closePopupOnSuccess = effect(() => {
    if (this.creationStatus() === 'success') {
      this.closeNewProductPopup();
    }
  });

  ngOnInit(): void {
    this.store.dispatch(catalogActions.loadCatalog({}));
  }

  /** Открывает модальное окно создания товара */
  openNewProductPopup(): void {
    this.store.dispatch(catalogActions.resetCreationState());
    this.newProductPopupOpen.set(true);
  }

  /** Закрывает модальное окно создания товара */
  closeNewProductPopup(): void {
    this.newProductPopupOpen.set(false);
    this.store.dispatch(catalogActions.resetCreationState());
  }

  /** Добавляет новый товар в каталог */
  addProduct(item: NewProductFormValues): void {
    const payload: Omit<CatalogItem, 'id'> = {
      ...item,
      weight: 0,
      deliveryTime: 0,
    };

    this.store.dispatch(catalogActions.createCatalogItem({ item: payload }));
  }

  protected get catalogData(): readonly CatalogItem[] {
    return this.catalogItems();
  }

  protected getSortState(tab: CatalogTab): CatalogSortState {
    return this.sortState()[tab];
  }

  protected onSort(tab: CatalogTab, column: number): void {
    this.sortState.update((state) => {
      const current = state[tab];
      const direction: SortDirection =
        current.column === column && current.direction === 'asc' ? 'desc' : 'asc';

      return {
        ...state,
        [tab]: { column, direction },
      };
    });
  }

  protected onSortKey(tab: CatalogTab, column: number, event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onSort(tab, column);
    }
  }

  protected isSorted(tab: CatalogTab, column: number): boolean {
    const state = this.sortState()[tab];
    return state.column === column;
  }

  protected getSortDirection(tab: CatalogTab, column: number): SortDirection | 'none' {
    return this.isSorted(tab, column) ? this.sortState()[tab].direction : 'none';
  }

  protected getAriaSort(tab: CatalogTab, column: number): 'ascending' | 'descending' | 'none' {
    const direction = this.getSortDirection(tab, column);
    if (direction === 'asc') {
      return 'ascending';
    }
    if (direction === 'desc') {
      return 'descending';
    }

    return 'none';
  }

  private sortCatalogItems(tab: CatalogTab): readonly CatalogItem[] {
    const items = this.catalogItems();
    if (!items.length) {
      return items;
    }

    const state = this.sortState()[tab];
    const accessors = tab === 'info' ? this.infoSortAccessors : this.logisticsSortAccessors;
    const accessor = accessors[state.column];

    if (!accessor) {
      return items;
    }

    const indexed = items.map((item, index) => ({ item, index }));
    indexed.sort((left, right) => {
      const comparison = this.compareSortValues(accessor(left.item), accessor(right.item));
      if (comparison === 0) {
        return left.index - right.index;
      }

      return state.direction === 'asc' ? comparison : -comparison;
    });

    return indexed.map(({ item }) => item);
  }

  private compareSortValues(left: SortValue, right: SortValue): number {
    const normalizedLeft = this.normalizeSortValue(left);
    const normalizedRight = this.normalizeSortValue(right);

    if (typeof normalizedLeft === 'number' && typeof normalizedRight === 'number') {
      return normalizedLeft - normalizedRight;
    }

    const leftString = String(normalizedLeft);
    const rightString = String(normalizedRight);

    return leftString.localeCompare(rightString, 'ru', { sensitivity: 'base' });
  }

  private normalizeSortValue(value: SortValue): number | string {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    return value.toString().toLocaleLowerCase('ru-RU');
  }
}
