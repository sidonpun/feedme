import { NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { WarehouseCatalogService } from './catalog.service';
import { Product } from '../shared/models';
import { filterByName } from './filter-by-name';
import { CatalogSortKey, CatalogSortState, SortDirection, sortProducts } from './sort-products';

interface ProductFormValue {
  name: string;
  type: Product['type'];
  sku: string;
  category: string;
  unit: Product['unit'];
  unitWeight: number | null;
  writeoff: Product['writeoff'];
  allergens: string;
  needsPacking: boolean;
  perishableAfterOpen: boolean;
  supplierMain: string;
  leadTimeDays: number | null;
  costEst: number | null;
  vat: string;
  purchasePrice: number | null;
  salePrice: number | null;
  tnvCode: string;
  marked: boolean;
  alcohol: boolean;
}

interface CatalogTab {
  id: string;
  label: string;
  categoryKey: string | null;
}

type PaginationButton =
  | { kind: 'page'; value: number; active: boolean }
  | { kind: 'ellipsis'; id: string };

@Component({
  standalone: true,
  selector: 'app-warehouse-catalog',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly catalogService = inject(WarehouseCatalogService);

  private readonly defaults: ProductFormValue = {
    name: '',
    type: 'РўРѕРІР°СЂ',
    sku: '',
    category: '',
    unit: 'РєРі',
    unitWeight: null,
    writeoff: 'FIFO',
    allergens: '',
    needsPacking: false,
    perishableAfterOpen: false,
    supplierMain: '',
    leadTimeDays: null,
    costEst: null,
    vat: '',
    purchasePrice: null,
    salePrice: null,
    tnvCode: '',
    marked: false,
    alcohol: false,
  };

  readonly dialogOpen = signal(false);
  readonly submitting = signal(false);
  readonly searchQuery = signal('');
  readonly pageSize = signal(15);
  readonly currentPage = signal(1);

  readonly activeSort = signal<CatalogSortState>({ key: 'name', direction: 'asc' });

  readonly productForm = this.fb.group({
    name: this.fb.control(this.defaults.name, {
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    type: this.fb.control<Product['type']>(this.defaults.type, {
      validators: [Validators.required],
    }),
    sku: this.fb.control(this.defaults.sku, {
      validators: [Validators.required, Validators.maxLength(60)],
    }),
    category: this.fb.control(this.defaults.category, {
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    unit: this.fb.control<Product['unit']>(this.defaults.unit, {
      validators: [Validators.required, Validators.maxLength(20)],
    }),
    unitWeight: this.fb.control<number | null>(this.defaults.unitWeight, {
      validators: [Validators.min(0)],
    }),
    writeoff: this.fb.control<Product['writeoff']>(this.defaults.writeoff),
    allergens: this.fb.control(this.defaults.allergens),
    needsPacking: this.fb.control(this.defaults.needsPacking),
    perishableAfterOpen: this.fb.control(this.defaults.perishableAfterOpen),
    supplierMain: this.fb.control(this.defaults.supplierMain),
    leadTimeDays: this.fb.control<number | null>(this.defaults.leadTimeDays, {
      validators: [Validators.min(0)],
    }),
    costEst: this.fb.control<number | null>(this.defaults.costEst, {
      validators: [Validators.min(0)],
    }),
    vat: this.fb.control(this.defaults.vat),
    purchasePrice: this.fb.control<number | null>(this.defaults.purchasePrice, {
      validators: [Validators.min(0)],
    }),
    salePrice: this.fb.control<number | null>(this.defaults.salePrice, {
      validators: [Validators.min(0)],
    }),
    tnvCode: this.fb.control(this.defaults.tnvCode),
    marked: this.fb.control(this.defaults.marked),
    alcohol: this.fb.control(this.defaults.alcohol),
  });

  readonly products = toSignal(this.catalogService.getAll(), {
    initialValue: [] as Product[],
  });

  readonly tabs = computed<CatalogTab[]>(() => {
    const products = this.products();
    const categories = new Map<string, { label: string; count: number }>();

    for (const product of products) {
      const label = this.normalizeCategoryLabel(product.category);
      const key = this.toCategoryKey(product.category);

      const stats = categories.get(key);
      if (stats) {
        stats.count += 1;
        continue;
      }

      categories.set(key, { label, count: 1 });
    }

    const categoryTabs = Array.from(categories.entries())
      .sort(([, a], [, b]) => a.label.localeCompare(b.label, 'ru-RU'))
      .map<CatalogTab>(([key, value]) => ({
        id: `category:${key}`,
        label: `${value.label} (${value.count})`,
        categoryKey: key,
      }));

    const totalLabel = `Р’СЃРµ РїРѕР·РёС†РёРё (${products.length})`;

    return [
      { id: 'all', label: totalLabel, categoryKey: null },
      ...categoryTabs,
    ];
  });

  readonly activeTab = computed(() => {
    const activeId = this.activeTab();
    const tabs = this.tabs();

    return tabs.find((tab) => tab.id === activeId) ?? tabs[0] ?? null;
  });

  readonly productsByActiveTab = computed(() => {
    const activeTab = this.activeTab();
    const products = this.products();

    if (!activeTab || activeTab.categoryKey === null) {
      return products;
    }

    return products.filter(
      (product) => this.toCategoryKey(product.category) === activeTab.categoryKey,
    );
  });

  readonly totalProductsCount = computed(() => this.products().length);

  readonly filteredProducts = computed(() => filterByName(this.products(), this.searchQuery(), 'ru-RU'));
  readonly sortedProducts = computed(() => sortProducts(this.filteredProducts(), this.activeSort()));

  readonly filteredProductsCount = computed(() => this.filteredProducts().length);
  readonly totalPages = computed(() => {
    const size = this.pageSize();
    const count = this.filteredProductsCount();

    if (size <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(count / size));
  });

  readonly paginatedProducts = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const products = this.sortedProducts();

    if (size <= 0) {
      return products;
    }

    const start = (page - 1) * size;
    return products.slice(start, start + size);
  });

  readonly visibleRange = computed(() => {
    const count = this.filteredProductsCount();

    if (count === 0) {
      return { from: 0, to: 0 };
    }

    const size = this.pageSize();
    const page = this.currentPage();
    const from = (page - 1) * size + 1;
    const to = Math.min(from + size - 1, count);

    return { from, to };
  });

  readonly paginationStatusLabel = computed(() => {
    const count = this.filteredProductsCount();

    if (count === 0) {
      return '0 ���?����Ő��';
    }

    const range = this.visibleRange();
    return `${range.from}-${range.to} ��� ${count} ���?����Ő��`;
  });

  readonly paginationButtons = computed<PaginationButton[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const maxButtons = 7;

    if (total <= maxButtons) {
      return Array.from({ length: total }, (_, index) => ({
        kind: 'page' as const,
        value: index + 1,
        active: index + 1 === current,
      }));
    }

    const buttons: PaginationButton[] = [];

    const addPage = (value: number) => {
      if (value < 1 || value > total) {
        return;
      }

      if (buttons.some(button => button.kind === 'page' && button.value === value)) {
        return;
      }

      buttons.push({ kind: 'page', value, active: value === current });
    };

    const addEllipsis = (id: string) => {
      if (buttons.some(button => button.kind === 'ellipsis' && button.id === id)) {
        return;
      }

      buttons.push({ kind: 'ellipsis', id });
    };

    addPage(1);

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 2) {
      end = Math.min(total - 1, 3);
    } else if (current >= total - 1) {
      start = Math.max(2, total - 2);
    }

    if (start > 2) {
      addEllipsis('left');
    } else {
      for (let page = 2; page < start; page += 1) {
        addPage(page);
      }
    }

    for (let page = start; page <= end; page += 1) {
      addPage(page);
    }

    if (end < total - 1) {
      addEllipsis('right');
    } else {
      for (let page = end + 1; page < total; page += 1) {
        addPage(page);
      }
    }

    addPage(total);

    return buttons;
  });

  readonly hasPagination = computed(() => this.totalPages() > 1);
  readonly normalizedSearchQuery = computed(() => this.searchQuery().trim());
  readonly productsCountLabel = computed(() => {
    const total = this.totalProductsCount();
    const filtered = this.filteredProductsCount();
    const hasSearch = this.normalizedSearchQuery().length > 0;

    if (!hasSearch || filtered === total) {
      return `${total} РїРѕР·РёС†РёР№`;
    }

    return `${filtered} РёР· ${total} РїРѕР·РёС†РёР№`;
  });

  private readonly clampPageEffect = effect(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (current > total) {
      this.currentPage.set(total);
    } else if (current < 1) {
      this.currentPage.set(1);
    }
  }, { allowSignalWrites: true });

  changeSort(key: CatalogSortKey): void {
    this.activeSort.update(current => {
      if (current.key === key) {
        const direction: SortDirection = current.direction === 'asc' ? 'desc' : 'asc';

        return { key, direction };
      }

      return { key, direction: 'asc' };
    });
  }

  ariaSort(key: CatalogSortKey): 'none' | 'ascending' | 'descending' {
    const currentSort = this.activeSort();

    if (currentSort.key !== key) {
      return 'none';
    }

    return currentSort.direction === 'asc' ? 'ascending' : 'descending';
  }

  sortAriaLabel(key: CatalogSortKey, columnLabel: string): string {
    const currentSort = this.activeSort();
    const willToggleToDescending = currentSort.key === key && currentSort.direction === 'asc';
    const nextDirection = willToggleToDescending ? 'descending' : 'ascending';
    const directionLabel = nextDirection === 'ascending' ? 'РїРѕ РІРѕР·СЂР°СЃС‚Р°РЅРёСЋ' : 'РїРѕ СѓР±С‹РІР°РЅРёСЋ';

    return `РЎРѕСЂС‚РёСЂРѕРІР°С‚СЊ РїРѕ В«${columnLabel}В» ${directionLabel}`;
  }

  sortIndicator(key: CatalogSortKey): string {
    const currentSort = this.activeSort();

    if (currentSort.key !== key) {
      return 'в†•';
    }

    return currentSort.direction === 'asc' ? 'в–І' : 'в–ј';
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    const normalized = Math.trunc(page);
    const clamped = Math.min(Math.max(normalized, 1), total);

    this.currentPage.set(clamped);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  trackPaginationButton(_: number, button: PaginationButton): string {
    return button.kind === 'page' ? `page-${button.value}` : `ellipsis-${button.id}`;
  }

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.resetForm();
  }

  openNewProductPopup(): void {
    this.openDialog();
  }

  closeNewProductPopup(): void {
    this.closeDialog();
  }

  async submit(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const raw = this.productForm.getRawValue();
    const payload: Product = {
      id: '',
      name: raw.name.trim(),
      type: raw.type,
      sku: raw.sku.trim(),
      category: raw.category.trim(),
      unit: raw.unit,
      unitWeight: this.normalizeNumber(raw.unitWeight),
      writeoff: raw.writeoff,
      allergens: raw.allergens.trim() || null,
      needsPacking: raw.needsPacking,
      perishableAfterOpen: raw.perishableAfterOpen,
      supplierMain: raw.supplierMain.trim() || null,
      leadTimeDays: this.normalizeNumber(raw.leadTimeDays),
      costEst: this.normalizeNumber(raw.costEst),
      vat: raw.vat.trim() || null,
      purchasePrice: this.normalizeNumber(raw.purchasePrice),
      salePrice: this.normalizeNumber(raw.salePrice),
      tnvCode: raw.tnvCode.trim() || null,
      marked: raw.marked,
      alcohol: raw.alcohol,
      alcoholCode: null,
      alcoholStrength: null,
      alcoholVolume: null,
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.catalogService.add(payload));
      this.closeDialog();
    } finally {
      this.submitting.set(false);
    }
  }

  trackByProductId(_: number, product: Product): string {
    return product.id;
  }

  updateSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  trackByTabId(_: number, tab: CatalogTab): string {
    return tab.id;
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
    this.currentPage.set(1);
  }

  private resetForm(): void {
    this.productForm.reset(this.defaults);
  }

  private normalizeNumber(value: number | null): number | null {
    if (value === null || Number.isNaN(value)) {
      return null;
    }

    if (value < 0) {
      return null;
    }

    return value;
  }

  private normalizeCategoryLabel(category: string | null | undefined): string {
    const trimmed = category?.trim();

    if (trimmed && trimmed.length > 0) {
      return trimmed;
    }

    return 'Р‘РµР· РєР°С‚РµРіРѕСЂРёРё';
  }

  private toCategoryKey(category: string | null | undefined): string {
    return this.normalizeCategoryLabel(category).toLocaleLowerCase('ru-RU');
  }
}

