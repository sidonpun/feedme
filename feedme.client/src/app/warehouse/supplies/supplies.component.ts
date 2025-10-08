
import { CommonModule } from '@angular/common';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith, take, tap } from 'rxjs';

import { SupplyProduct, SupplyRow, SupplyStatus } from '../shared/models';
import { computeExpiryStatus } from '../shared/status.util';
import { SuppliesService } from './supplies.service';
import { ApiRequestError } from '../../services/api-request-error';

type SupplyFormValue = {

  docNo: string;
  arrivalDate: string;
  warehouse: string;
  responsible: string;
  productId: string;

  qty: number;
  expiryDate: string;
};

type SortDirection = 'asc' | 'desc';
type SortKey =
  | 'docNo'
  | 'arrivalDate'
  | 'warehouse'
  | 'responsible'
  | 'sku'
  | 'name'
  | 'qty'
  | 'expiryDate'
  | 'supplier'
  | 'status';

interface SubmissionErrorState {
  readonly title: string;
  readonly details: readonly string[];
}

@Component({
  standalone: true,
  selector: 'app-supplies',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './supplies.component.html',
  styleUrl: './supplies.component.scss',
  animations: [
    trigger('list', [
      transition('* => *', [query('@row', stagger(40, []), { optional: true })]),
    ]),
    trigger('row', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(6px)' })),
      ]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliesComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly suppliesService = inject(SuppliesService);

  readonly rowsReady = signal(false);
  readonly rows = toSignal(
    this.suppliesService.getAll().pipe(tap(() => this.rowsReady.set(true))),
    { initialValue: [] as SupplyRow[] },
  );
  readonly products$ = this.suppliesService.getProducts();
  private readonly productsSignal = toSignal(this.products$, { initialValue: [] as SupplyProduct[] });

  readonly dialogOpen = signal(false);
  readonly submissionError = signal<SubmissionErrorState | null>(null);
  readonly isSubmitting = signal(false);

  private readonly selectedWarehouse = signal<string | null>(null);

  readonly warehouseOptions = computed(() => {
    const rows = this.rows();
    if (!Array.isArray(rows) || rows.length === 0) {
      return [] as string[];
    }

    const unique = new Set<string>();
    for (const row of rows) {
      if (row.warehouse) {
        unique.add(row.warehouse);
      }
    }

    return Array.from(unique).sort((left, right) => left.localeCompare(right, 'ru'));
  });

  readonly activeWarehouse = computed(() => {
    const selected = this.selectedWarehouse();
    const options = this.warehouseOptions();
    if (selected && options.includes(selected)) {
      return selected;
    }

    return options[0] ?? null;
  });

  query = '';
  dateFrom = '';
  dateTo = '';

  sortKey: SortKey = 'docNo';
  sortDir: SortDirection = 'asc';

  private readonly statusOrder: Record<SupplyStatus, number> = { ok: 1, warning: 2, expired: 3 };

  readonly form = this.fb.group({
    docNo: this.fb.control('', { validators: [Validators.required] }),
    arrivalDate: this.fb.control('', { validators: [Validators.required] }),
    warehouse: this.fb.control('', { validators: [Validators.required] }),
    responsible: this.fb.control(''),
    productId: this.fb.control('', { validators: [Validators.required] }),
    qty: this.fb.control(0, { validators: [Validators.required, Validators.min(0.0001)] }),
    expiryDate: this.fb.control('', { validators: [Validators.required] }),
  });

  private readonly selectedProductId = toSignal(
    this.form.controls.productId.valueChanges.pipe(startWith(this.form.controls.productId.value)),
    { initialValue: this.form.controls.productId.value },
  );

  readonly selectedProduct = computed<SupplyProduct | null>(() => {

    const id = this.selectedProductId();
    if (!id) {
      return null;
    }

    return this.suppliesService.getProductById(id) ?? null;
  });

  readonly kpi = computed((): { weekSupplies: number; weekSpend: number; items: number; expired: number } => {
    const rows = this.rows();
    const warehouse = this.activeWarehouse();
    const filteredRows =
      warehouse && Array.isArray(rows) && rows.length > 0
        ? rows.filter(row => row.warehouse === warehouse)
        : rows;
    const products = this.productsSignal();

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    endOfToday.setMilliseconds(endOfToday.getMilliseconds() - 1);

    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const priceByProduct = new Map<string, number>();
    for (const product of products) {
      priceByProduct.set(product.id, product.purchasePrice ?? 0);
    }

    let weekSupplies = 0;
    let weekSpend = 0;
    let expired = 0;
    const uniqueProductIds = new Set<string>();

    for (const row of filteredRows) {
      uniqueProductIds.add(row.productId);

      if (row.status === 'expired') {
        expired += 1;
      }

      const arrival = this.parseIsoDate(row.arrivalDate);
      if (!Number.isNaN(arrival.getTime()) && arrival >= weekStart && arrival <= endOfToday) {
        weekSupplies += 1;
        const price = priceByProduct.get(row.productId) ?? 0;
        weekSpend += price * row.qty;
      }
    }

    const normalizedWeekSpend = Math.round(weekSpend * 100) / 100;

    return {
      weekSupplies,
      weekSpend: normalizedWeekSpend,
      items: uniqueProductIds.size,
      expired,
    };
  });

  get sortedRows(): SupplyRow[] {
    const rows = this.rows();
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const filtered = rows.filter(row => this.matchesFilters(row));
    const key = this.sortKey;
    const multiplier = this.sortDir === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const left = this.valueForSort(a, key);
      const right = this.valueForSort(b, key);

      if (left < right) {
        return -1 * multiplier;
      }

      if (left > right) {
        return 1 * multiplier;
      }

      return 0;
    });
  }

  openDialog(): void {
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.resetForm();
  }

  submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as SupplyFormValue;
    const product = this.suppliesService.getProductById(value.productId);

    if (!product) {
      this.form.controls.productId.setErrors({ missingProduct: true });
      return;
    }

    const docNo = value.docNo.trim();
    const warehouse = value.warehouse.trim();
    const responsible = value.responsible.trim();
    const qty = Number(value.qty);

    if (!docNo) {
      this.form.controls.docNo.setErrors({ required: true });
      this.form.controls.docNo.markAsTouched();
      return;
    }

    if (!warehouse) {
      this.form.controls.warehouse.setErrors({ required: true });
      this.form.controls.warehouse.markAsTouched();
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      this.form.controls.qty.setErrors({ min: true });
      this.form.controls.qty.markAsTouched();
      return;
    }

    const payload: Omit<SupplyRow, 'id'> = {
      docNo,
      arrivalDate: value.arrivalDate,
      warehouse,
      responsible: responsible ? responsible : undefined,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      qty,
      unit: product.unit,
      expiryDate: value.expiryDate,
      supplier: product.supplier,
      status: computeExpiryStatus(value.expiryDate, value.arrivalDate),
    };

    this.submissionError.set(null);
    this.isSubmitting.set(true);

    this.suppliesService
      .add(payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.selectedWarehouse.set(warehouse);
          this.closeDialog();
          this.isSubmitting.set(false);
        },
        error: cause => {
          this.isSubmitting.set(false);
          this.submissionError.set(this.toSubmissionError(cause));
          this.form.setErrors({ submissionFailed: true });
        },
      });
  }

  openNewSupply(): void {
    this.openDialog();
  }

  onReset(): void {
    this.query = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedWarehouse.set(null);
  }

  onExport(): void {
    const rows = this.sortedRows;
    if (rows.length === 0 || typeof document === 'undefined') {
      return;
    }

    const header = [
      '№ док.',
      'Дата прихода',
      'Склад',
      'Ответственный',
      'SKU',
      'Название',
      'Количество',
      'Срок годности',
      'Поставщик',
      'Статус',
    ];

    const rowsData = rows.map(row => [
      row.docNo ?? '',
      row.arrivalDate ?? '',
      row.warehouse ?? '',
      row.responsible ?? '',
      row.sku ?? '',
      row.name ?? '',
      `${row.qty} ${row.unit ?? ''}`.trim(),
      row.expiryDate ?? '',
      row.supplier ?? '',
      this.statusText(row.status),
    ]);

    const csv = [header, ...rowsData]
      .map(columns =>
        columns
          .map(value => {
            const normalized = value.toString().replace(/"/g, '""');
            return `"${normalized}"`;
          })
          .join(';'),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supplies-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortKey = key;
    this.sortDir = 'asc';
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (this.sortKey !== key) {
      return 'none';
    }

    return this.sortDir === 'asc' ? 'ascending' : 'descending';
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey !== key) {
      return '↕';
    }

    return this.sortDir === 'asc' ? '▲' : '▼';
  }

  trackByRowId(_: number, row: SupplyRow): string {
    return row.id;
  }

  statusClass(status: SupplyStatus): Record<string, boolean> {
    return {
      'status-pill': true,
      'status-ok': status === 'ok',
      'status-warn': status === 'warning',
      'status-expired': status === 'expired',
    };
  }

  statusText(status: SupplyStatus): string {
    if (status === 'ok') {
      return 'Ок';
    }

    if (status === 'warning') {
      return 'Скоро срок';
    }

    return 'Просрочено';
  }

  onWarehouseSelect(name: string | null): void {
    if (typeof name !== 'string') {
      this.selectedWarehouse.set(null);
      return;
    }

    const normalized = name.trim();
    this.selectedWarehouse.set(normalized.length > 0 ? normalized : null);
  }

  private parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(part => Number.parseInt(part, 10));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return new Date(NaN);
    }

    return new Date(year, month - 1, day);
  }

  private resetForm(): void {
    this.form.reset({
      docNo: '',
      arrivalDate: '',
      warehouse: '',
      responsible: '',
      productId: '',
      qty: 0,
      expiryDate: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.setErrors(null);
    this.submissionError.set(null);
    this.isSubmitting.set(false);
  }

  private toSubmissionError(cause: unknown): SubmissionErrorState {
    if (cause instanceof ApiRequestError) {
      const base = 'Не удалось сохранить поставку.';
      const message = cause.userMessage;
      const title = message.startsWith(base) ? message : `${base} ${message}`;
      return {
        title,
        details:
          cause.details.length > 0
            ? cause.details
            : [`Метод: ${cause.context.method}`, `URL: ${cause.context.url}`],
      } satisfies SubmissionErrorState;
    }

    if (cause instanceof Error) {
      return {
        title: 'Не удалось сохранить поставку. Попробуйте ещё раз.',
        details: cause.message ? [`Причина: ${cause.message}`] : [],
      } satisfies SubmissionErrorState;
    }

    return {
      title: 'Не удалось сохранить поставку. Попробуйте ещё раз.',
      details: [],
    } satisfies SubmissionErrorState;
  }

  private matchesFilters(row: SupplyRow): boolean {
    const warehouse = this.activeWarehouse();
    if (warehouse && row.warehouse !== warehouse) {
      return false;
    }

    if (!this.matchesQuery(row)) {
      return false;
    }

    const from = this.toDateOrNull(this.dateFrom);
    const to = this.toDateOrNull(this.dateTo);
    const arrival = this.toDateOrNull(row.arrivalDate);

    if (from && arrival && arrival < from) {
      return false;
    }

    if (to && arrival && arrival > to) {
      return false;
    }

    return true;
  }

  private matchesQuery(row: SupplyRow): boolean {
    const term = this.query.trim().toLowerCase();
    if (!term) {
      return true;
    }

    return [row.docNo, row.sku, row.name]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .some(value => value.toLowerCase().includes(term));
  }

  private valueForSort(row: SupplyRow, key: SortKey): number | string {
    if (key === 'qty') {
      return Number(row.qty);
    }

    if (key === 'arrivalDate' || key === 'expiryDate') {
      const parsed = this.toDateOrNull(row[key]);
      return parsed ? parsed.getTime() : 0;
    }

    if (key === 'status') {
      return this.statusOrder[row.status] ?? 99;
    }

    const value = row[key];
    if (value == null) {
      return '';
    }

    return value.toString().toLowerCase();
  }

  private toDateOrNull(value: string | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsed = this.parseIsoDate(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
