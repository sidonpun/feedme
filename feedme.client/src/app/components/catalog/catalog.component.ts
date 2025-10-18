import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Pipe,
  PipeTransform,
  ElementRef,
  QueryList,
  NgZone,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { fromEvent, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { NewProductFormValues } from '../catalog-new-product-popup/catalog-new-product-popup.component';
import { CatalogItem } from '../../services/catalog.service';
import { EmptyStateComponent } from '../../warehouse/ui/empty-state.component';
import { CatalogNewProductPopupComponent } from '../catalog-new-product-popup/catalog-new-product-popup.component';
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

type CatalogPaginationMeta = {
  readonly items: readonly CatalogItem[];
  readonly page: number;
  readonly totalPages: number;
  readonly totalItems: number;
};

type CatalogItemFlag = {
  readonly code?: string | null;
  readonly full?: string | null;
  readonly name?: string | null;
  readonly short?: string | null;
};

export const FLAG_SHORT: Record<string, string> = {
  pack: 'Фас.',
  spoil_open: 'После вскр.',
  fragile: 'Хрупк.',
  temp: 'Темп.',
} as const;

export const FLAG_FULL: Record<string, string> = {
  pack: 'Требует фасовки',
  spoil_open: 'Портится после вскрытия',
  fragile: 'Хрупкий товар',
  temp: 'Требует температурный режим',
} as const;


@Pipe({
  name: 'booleanLabel',
  standalone: true,
})
export class BooleanLabelPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return 'вЂ”';
    }

    return value ? 'Р”Р°' : 'РќРµС‚';
  }
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    BooleanLabelPipe,
    EmptyStateComponent,
    CatalogNewProductPopupComponent,
  ],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
}) 
export class CatalogComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly ngZone = inject(NgZone);

  @ViewChild('catalogCard') private catalogCard?: ElementRef<HTMLElement>;
  @ViewChild('catalogCardBody') private catalogCardBody?: ElementRef<HTMLElement>;

  @ViewChild('infoTableContainer') private infoTableContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('infoTableHeader') private infoTableHeader?: ElementRef<HTMLElement>;
  @ViewChildren('infoRow') private infoRows?: QueryList<ElementRef<HTMLTableRowElement>>;
  @ViewChild('infoPagination') private infoPagination?: ElementRef<HTMLElement>;

  @ViewChild('logisticsTableContainer') private logisticsTableContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('logisticsTableHeader') private logisticsTableHeader?: ElementRef<HTMLElement>;
  @ViewChildren('logisticsRow') private logisticsRows?: QueryList<ElementRef<HTMLTableRowElement>>;
  @ViewChild('logisticsPagination') private logisticsPagination?: ElementRef<HTMLElement>;

  private readonly activeTabSignal = signal<CatalogTab>('info');

  private readonly defaultRowsPerPage = 6;
  private readonly rowsPerPageState = signal<Record<CatalogTab, number>>({
    info: this.defaultRowsPerPage,
    logistics: this.defaultRowsPerPage,
  });

  private readonly lastMeasuredRowHeight: Partial<Record<CatalogTab, number>> = {};
  private readonly measurementPadding = 32;
  private readonly estimatedRowHeight = 64;

  maxShown = 3;

  private viewInitialized = false;
  private measureFrame: number | null = null;
  private resizeObserver?: ResizeObserver;
  private resizeSubscription?: Subscription;

  get activeTab(): CatalogTab {
    return this.activeTabSignal();
  }

  set activeTab(value: CatalogTab) {
    if (this.activeTabSignal() === value) {
      return;
    }

    this.activeTabSignal.set(value);
    this.scheduleLayoutMeasure();
  }

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
  private readonly paginationState = signal<Record<CatalogTab, number>>({
    info: 1,
    logistics: 1,
  });

  readonly infoPage = computed(() => this.buildPaginationMeta('info'));
  readonly logisticsPage = computed(() => this.buildPaginationMeta('logistics'));


  private readonly layoutMeasureTrigger = effect(() => {
    const tab = this.activeTabSignal();
    if (tab === 'info') {
      this.infoPage();
    } else {
      this.logisticsPage();
    }

    if (this.viewInitialized) {
      this.scheduleLayoutMeasure();
    }
  });

  private readonly clampPagination = effect(
    () => {
      const infoTotal = this.calculateTotalPages(this.sortedInfoItems().length, 'info');
      const logisticsTotal = this.calculateTotalPages(this.sortedLogisticsItems().length, 'logistics');

      this.paginationState.update((state) => {
        let changed = false;
        const next: Record<CatalogTab, number> = { ...state };

        const clamp = (value: number, total: number) => {
          const safeTotal = Math.max(1, total);
          return Math.min(Math.max(1, value), safeTotal);
        };

        const infoPage = clamp(state.info, infoTotal);
        if (infoPage !== state.info) {
          next.info = infoPage;
          changed = true;
        }

        const logisticsPage = clamp(state.logistics, logisticsTotal);
        if (logisticsPage !== state.logistics) {
          next.logistics = logisticsPage;
          changed = true;
        }

        return changed ? next : state;
      });
    },
    { allowSignalWrites: true },
  );

  private readonly closePopupOnSuccess = effect(() => {
    if (this.creationStatus() === 'success') {
      this.closeNewProductPopup();
    }
  });

  ngOnInit(): void {
    this.store.dispatch(catalogActions.loadCatalog({}));
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleLayoutMeasure();

    const card = this.catalogCard?.nativeElement;
    if (card && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleLayoutMeasure());
      this.resizeObserver.observe(card);
    }

    this.ngZone.runOutsideAngular(() => {
      this.resizeSubscription = fromEvent(window, 'resize')
        .pipe(auditTime(150))
        .subscribe(() => {
          this.ngZone.run(() => this.scheduleLayoutMeasure());
        });
    });
  }

  ngOnDestroy(): void {
    if (this.measureFrame !== null) {
      cancelAnimationFrame(this.measureFrame);
      this.measureFrame = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeSubscription?.unsubscribe();
  }

  /** РћС‚РєСЂС‹РІР°РµС‚ РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ СЃРѕР·РґР°РЅРёСЏ С‚РѕРІР°СЂР° */
  openNewProductPopup(): void {
    this.store.dispatch(catalogActions.resetCreationState());
    this.newProductPopupOpen.set(true);
  }

  /** Р—Р°РєСЂС‹РІР°РµС‚ РјРѕРґР°Р»СЊРЅРѕРµ РѕРєРЅРѕ СЃРѕР·РґР°РЅРёСЏ С‚РѕРІР°СЂР° */
  closeNewProductPopup(): void {
    this.newProductPopupOpen.set(false);
    this.store.dispatch(catalogActions.resetCreationState());
  }

  /** Р”РѕР±Р°РІР»СЏРµС‚ РЅРѕРІС‹Р№ С‚РѕРІР°СЂ РІ РєР°С‚Р°Р»РѕРі */
  addProduct(item: NewProductFormValues): void {
    const { flagCodes, ...rest } = item;
    void flagCodes;

    const payload: Omit<CatalogItem, 'id'> = {
      ...rest,
      weight: 0,
      deliveryTime: 0,
    };

    this.store.dispatch(catalogActions.createCatalogItem({ item: payload }));
  }

  protected get catalogData(): readonly CatalogItem[] {
    return this.catalogItems();
  }

  protected onSort(tab: CatalogTab, column: number): void {
    this.sortState.update((state) => {
      const current = state[tab];
      const direction: SortDirection = current.column === column && current.direction === 'asc' ? 'desc' : 'asc';

      return {
        ...state,
        [tab]: { column, direction },
      };
    });
  }


  protected nextPage(tab: CatalogTab): void {
    const meta = this.getPaginationMeta(tab);
    if (meta.page >= meta.totalPages) {
      return;
    }

    this.paginationState.update((state) => ({
      ...state,
      [tab]: meta.page + 1,
    }));

    this.scheduleLayoutMeasure();
  }

  protected prevPage(tab: CatalogTab): void {
    const meta = this.getPaginationMeta(tab);
    if (meta.page <= 1) {
      return;
    }
    this.paginationState.update((state) => ({
      ...state,
      [tab]: meta.page - 1,
    }));

    this.scheduleLayoutMeasure();
  }

  protected canPrev(tab: CatalogTab): boolean {
    return this.getPaginationMeta(tab).page > 1;
  }

  protected canNext(tab: CatalogTab): boolean {
    const meta = this.getPaginationMeta(tab);
    return meta.page < meta.totalPages;
  }

  protected getHiddenFlagsTooltip(item: CatalogItem): string {
    const flags = (item as { flags?: ReadonlyArray<CatalogItemFlag> }).flags;
    if (!flags || flags.length <= this.maxShown) {
      return '';
    }

    const labels = flags
      .slice(this.maxShown)
      .map((flag) => this.resolveFlagFull(flag))
      .filter((label) => label.length > 0);

    if (!labels.length) {
      return '';
    }

    return labels.join(', ');
  }

  protected resolveFlagShort(flag: CatalogItemFlag | null | undefined): string {
    const code = this.normalizeFlagCode(flag);
    if (code && Object.prototype.hasOwnProperty.call(FLAG_SHORT, code)) {
      return FLAG_SHORT[code];
    }

    return (flag?.short ?? flag?.name ?? flag?.full ?? '').trim();
  }

  protected resolveFlagFull(flag: CatalogItemFlag | null | undefined): string {
    const code = this.normalizeFlagCode(flag);
    if (code && Object.prototype.hasOwnProperty.call(FLAG_FULL, code)) {
      return FLAG_FULL[code];
    }

    return (flag?.full ?? flag?.name ?? flag?.short ?? '').trim();
  }

  private normalizeFlagCode(flag: CatalogItemFlag | null | undefined): string {
    const code = flag?.code ?? '';
    return typeof code === 'string' ? code.trim() : '';
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

  private buildPaginationMeta(tab: CatalogTab): CatalogPaginationMeta {
    const page = this.paginationState()[tab];
    const items =
      tab === 'info' ? this.sortedInfoItems() : this.sortedLogisticsItems();
    const totalItems = items.length;
    const rowsPerPage = this.rowsPerPageState()[tab] ?? this.defaultRowsPerPage;
    const totalPages = this.calculateTotalPages(totalItems, tab);

    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * rowsPerPage;
    const pagedItems = items.slice(start, start + rowsPerPage);

    return {
      items: pagedItems,
      page: safePage,
      totalPages,
      totalItems,
    };
  }

  private getPaginationMeta(tab: CatalogTab): CatalogPaginationMeta {
    return tab === 'info' ? this.infoPage() : this.logisticsPage();
  }

  private calculateTotalPages(totalItems: number, tab: CatalogTab): number {
    const rowsPerPage = Math.max(1, this.rowsPerPageState()[tab] ?? this.defaultRowsPerPage);
    if (totalItems <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(totalItems / rowsPerPage));
  }

  private scheduleLayoutMeasure(): void {
    if (!this.viewInitialized) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (this.measureFrame !== null) {
      cancelAnimationFrame(this.measureFrame);
    }

    this.measureFrame = requestAnimationFrame(() => {
      this.measureFrame = null;
      this.measureRowsPerPage(this.activeTab);
    });
  }

  private measureRowsPerPage(tab: CatalogTab): void {
    const refs = this.getTabDomRefs(tab);
    if (!refs?.container || typeof window === 'undefined') {
      return;
    }

    const { container, header, rows, pagination } = refs;
    const containerRect = container.getBoundingClientRect();
    const paginationHeight = pagination?.getBoundingClientRect().height ?? 0;
    const cardBodyPadding = this.getCardBodyPadding();
    const availableHeight =
      window.innerHeight - containerRect.top - paginationHeight - cardBodyPadding - this.measurementPadding;

    if (availableHeight <= 0) {
      this.updateRowsPerPage(tab, 1);
      return;
    }

    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const rowHeight = this.getRowHeight(tab, rows);

    if (rowHeight <= 0) {
      return;
    }

    const usableHeight = availableHeight - headerHeight;
    if (usableHeight <= 0) {
      this.updateRowsPerPage(tab, 1);
      return;
    }

    const capacity = Math.max(1, Math.floor(usableHeight / rowHeight));
    this.updateRowsPerPage(tab, capacity);
  }

  private getTabDomRefs(tab: CatalogTab): {
    container: HTMLDivElement | null;
    header: HTMLElement | null;
    rows: QueryList<ElementRef<HTMLTableRowElement>> | undefined;
    pagination: HTMLElement | null;
  } | null {
    if (tab === 'info') {
      return {
        container: this.infoTableContainer?.nativeElement ?? null,
        header: this.infoTableHeader?.nativeElement ?? null,
        rows: this.infoRows,
        pagination: this.infoPagination?.nativeElement ?? null,
      };
    }

    return {
      container: this.logisticsTableContainer?.nativeElement ?? null,
      header: this.logisticsTableHeader?.nativeElement ?? null,
      rows: this.logisticsRows,
      pagination: this.logisticsPagination?.nativeElement ?? null,
    };
  }

  private getRowHeight(
    tab: CatalogTab,
    rows?: QueryList<ElementRef<HTMLTableRowElement>>
  ): number {
    if (rows && rows.length) {
      let maxHeight = 0;
      rows.forEach((row) => {
        const height = row.nativeElement.getBoundingClientRect().height;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });

      if (maxHeight > 0) {
        const previous = this.lastMeasuredRowHeight[tab] ?? 0;
        const nextHeight = Math.max(previous, maxHeight);
        // Persist the tallest observed row height to keep the page size stable
        // when rows with additional flags temporarily leave the current page.
        this.lastMeasuredRowHeight[tab] = nextHeight;
        return nextHeight;
      }
    }

    return this.lastMeasuredRowHeight[tab] ?? this.estimatedRowHeight;
  }

  private updateRowsPerPage(tab: CatalogTab, value: number): void {
    const normalized = Math.max(1, value);
    this.rowsPerPageState.update((state) => {
      if (state[tab] === normalized) {
        return state;
      }

      return { ...state, [tab]: normalized };
    });
  }

  private getCardBodyPadding(): number {
    const bodyEl = this.catalogCardBody?.nativeElement;
    if (!bodyEl) {
      return 0;
    }

    const style = getComputedStyle(bodyEl);
    const padding = parseFloat(style.paddingBottom || '0');
    return Number.isFinite(padding) ? padding : 0;
  }

  private compareSortValues(left: SortValue, right: SortValue): number {
    const normalizedLeft = this.normalizeSortValue(left);
    const normalizedRight = this.normalizeSortValue(right);

    if (typeof normalizedLeft === 'number' && typeof normalizedRight === 'number') {
      return normalizedLeft - normalizedRight;
    }

    if (normalizedLeft === normalizedRight) {
      return 0;
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

