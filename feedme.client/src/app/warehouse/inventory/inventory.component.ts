import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  InventoryDocument,
  InventoryLinePayload,
  InventoryStatus,
  UpsertInventoryPayload,
} from '../../services/inventory.service';
import { InventoryFacade } from './inventory.facade';
import { WarehouseService } from '../warehouse.service';
import { EmptyStateComponent } from '../ui/empty-state.component';
import { FieldComponent } from '../ui/field.component';

type InventoryItemFormGroup = FormGroup;

@Component({
  standalone: true,
  selector: 'app-inventory',
  imports: [CommonModule, NgClass, NgFor, NgIf, ReactiveFormsModule, EmptyStateComponent, FieldComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  private static readonly currencyFormatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });

  private readonly facade = inject(InventoryFacade);
  private readonly warehouseService = inject(WarehouseService);
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly warehouseFilterSignal = signal('');
  private readonly searchFilterSignal = signal('');
  private readonly dateFromSignal = signal('');
  private readonly dateToSignal = signal('');

  readonly documents = this.facade.documents();
  readonly loading = this.facade.loading();

  readonly filteredDocuments = computed(() => {
    const documents = this.documents();
    if (!documents.length) {
      return [] as InventoryDocument[];
    }

    const warehouseFilter = this.normalize(this.warehouseFilterSignal());
    const searchFilter = this.normalize(this.searchFilterSignal());
    const dateFrom = this.dateFromSignal();
    const dateTo = this.dateToSignal();

    return documents.filter((document) => {
      if (warehouseFilter && document.warehouse.toLowerCase() !== warehouseFilter) {
        return false;
      }

      if (!this.matchesDateRange(document.startedAt, dateFrom, dateTo)) {
        return false;
      }

      if (!searchFilter) {
        return true;
      }

      return (
        document.number.toLowerCase().includes(searchFilter) ||
        document.items.some((item) => {
          const sku = item.sku.toLowerCase();
          const name = item.itemName.toLowerCase();
          return sku.includes(searchFilter) || name.includes(searchFilter);
        })
      );
    });
  });

  readonly totalDifference = computed(() =>
    this.filteredDocuments().reduce((sum, document) => sum + document.totalDifference, 0),
  );

  readonly selection = signal<string[]>([]);
  readonly drawerDocumentId = signal<string | null>(null);
  readonly deleteDialogOpen = signal(false);
  readonly activeDocument = computed(() => {
    const id = this.drawerDocumentId();
    if (!id) {
      return null;
    }

    return this.documents().find((document) => document.id === id) ?? null;
  });

  readonly deleteTargetIds = signal<string[]>([]);
  readonly editMode = signal<'create' | 'edit'>('create');
  readonly formDialogOpen = signal(false);
  readonly formTitle = computed(() =>
    this.editMode() === 'create' ? 'Новая инвентаризация' : 'Редактировать инвентаризацию',
  );

  readonly statusOptions: ReadonlyArray<{ value: InventoryStatus; label: string }> = [
    { value: 'draft', label: 'Черновик' },
    { value: 'in-progress', label: 'В работе' },
    { value: 'completed', label: 'Завершена' },
    { value: 'cancelled', label: 'Отменена' },
  ];

  readonly inventoryForm = this.fb.group({
    id: this.fb.control(''),
    number: this.fb.control('', { validators: [Validators.required] }),
    warehouse: this.fb.control('', { validators: [Validators.required] }),
    responsible: this.fb.control(''),
    startedAt: this.fb.control('', { validators: [Validators.required] }),
    completedAt: this.fb.control(''),
    status: this.fb.control<InventoryStatus>('draft', { validators: [Validators.required] }),
    items: this.fb.array<InventoryItemFormGroup>([]),
  });

  readonly formTotals = computed(() => {
    const items = this.itemsArray.controls.map((control) => control.getRawValue());
    const expected = items.reduce((sum, item) => sum + this.safeNumber(item.unitPrice) * this.safeNumber(item.expectedQuantity), 0);
    const counted = items.reduce((sum, item) => sum + this.safeNumber(item.unitPrice) * this.safeNumber(item.countedQuantity), 0);
    return {
      expected,
      counted,
      difference: counted - expected,
    };
  });

  @Input()
  set warehouseFilter(value: string) {
    this.warehouseFilterSignal.set(value ?? '');
  }

  @Input()
  set searchFilter(value: string) {
    this.searchFilterSignal.set(value ?? '');
  }

  @Input()
  set dateFrom(value: string) {
    this.dateFromSignal.set(value ?? '');
  }

  @Input()
  set dateTo(value: string) {
    this.dateToSignal.set(value ?? '');
  }

  get itemsArray(): FormArray<InventoryItemFormGroup> {
    return this.inventoryForm.controls.items as FormArray<InventoryItemFormGroup>;
  }

  formatCurrency(value: number): string {
    return InventoryComponent.currencyFormatter.format(value);
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('ru-RU');
  }

  statusLabel(status: InventoryStatus): string {
    switch (status) {
      case 'in-progress':
        return 'В работе';
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      default:
        return 'Черновик';
    }
  }

  statusClass(status: InventoryStatus): string {
    switch (status) {
      case 'completed':
        return 'badge--success';
      case 'in-progress':
        return 'badge--accent';
      case 'cancelled':
        return 'badge--danger';
      default:
        return 'badge--muted';
    }
  }

  openDrawer(document: InventoryDocument): void {
    this.drawerDocumentId.set(document.id);
  }

  closeDrawer(): void {
    this.drawerDocumentId.set(null);
  }

  toggleSelection(id: string, checked: boolean): void {
    const current = new Set(this.selection());
    if (checked) {
      current.add(id);
    } else {
      current.delete(id);
    }
    this.selection.set(Array.from(current));
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selection.set(this.filteredDocuments().map((document) => document.id));
      return;
    }
    this.selection.set([]);
  }

  handleAllCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleAll(input?.checked ?? false);
  }

  handleRowCheckbox(id: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleSelection(id, input?.checked ?? false);
  }

  openCreateDialog(): void {
    this.editMode.set('create');
    this.resetForm();
    const draftNumber = this.generateInventoryNumber();
    const warehouse = this.warehouseFilterSignal() || 'Главный склад';

    this.inventoryForm.reset({
      id: '',
      number: draftNumber,
      warehouse,
      responsible: '',
      startedAt: this.todayIso(),
      completedAt: '',
      status: 'draft' as InventoryStatus,
      items: [],
    });

    this.itemsArray.clear();
    const suggestedItems = this.buildDefaultItems(warehouse);
    if (suggestedItems.length) {
      suggestedItems.forEach((item) => this.itemsArray.push(this.createItemGroup(item)));
    } else {
      this.itemsArray.push(this.createItemGroup());
    }

    this.formDialogOpen.set(true);
  }

  openEditDialog(document: InventoryDocument): void {
    this.editMode.set('edit');
    this.resetForm();

    this.inventoryForm.patchValue({
      id: document.id,
      number: document.number,
      warehouse: document.warehouse,
      responsible: document.responsible,
      startedAt: this.toDateInput(document.startedAt),
      completedAt: document.completedAt ? this.toDateInput(document.completedAt) : '',
      status: document.status,
    });

    this.itemsArray.clear();
    document.items.forEach((item) =>
      this.itemsArray.push(
        this.createItemGroup({
          catalogItemId: item.catalogItemId,
          sku: item.sku,
          itemName: item.itemName,
          category: item.category,
          expectedQuantity: item.expectedQuantity,
          countedQuantity: item.countedQuantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
        }),
      ),
    );

    this.formDialogOpen.set(true);
  }

  closeFormDialog(): void {
    this.formDialogOpen.set(false);
    this.resetForm();
  }

  addItem(): void {
    this.itemsArray.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    this.itemsArray.removeAt(index);
  }

  async submitForm(): Promise<void> {
    const itemsArray = this.itemsArray;
    if (!itemsArray.length) {
      itemsArray.push(this.createItemGroup());
      return;
    }

    itemsArray.markAllAsTouched();
    this.inventoryForm.markAllAsTouched();

    if (this.inventoryForm.invalid) {
      return;
    }

    const raw = this.inventoryForm.getRawValue();
    const payload = this.toPayload(raw);

    if (this.editMode() === 'create') {
      const created = await this.facade.create(payload);
      this.selection.set([]);
      this.drawerDocumentId.set(created.id);
    } else {
      const id = raw.id;
      if (!id) {
        return;
      }
      await this.facade.update(id, payload);
    }

    this.formDialogOpen.set(false);
    this.resetForm();
  }

  startDelete(document: InventoryDocument): void {
    this.deleteTargetIds.set([document.id]);
    this.deleteDialogOpen.set(true);
  }

  startDeleteSelection(): void {
    const ids = this.selection();
    if (!ids.length) {
      return;
    }
    this.deleteTargetIds.set(ids);
    this.deleteDialogOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteDialogOpen.set(false);
    this.deleteTargetIds.set([]);
  }

  async confirmDelete(): Promise<void> {
    const ids = this.deleteTargetIds();
    if (!ids.length) {
      this.cancelDelete();
      return;
    }

    if (ids.length === 1) {
      await this.facade.delete(ids[0]);
    } else {
      await this.facade.deleteMany(ids);
    }

    this.selection.set([]);
    if (ids.includes(this.drawerDocumentId() ?? '')) {
      this.closeDrawer();
    }

    this.cancelDelete();
  }

  differenceClass(value: number): string {
    if (value > 0) {
      return 'pos';
    }
    if (value < 0) {
      return 'neg';
    }
    return '';
  }

  trackById(_: number, document: InventoryDocument): string {
    return document.id;
  }

  private matchesDateRange(value: string, from: string, to: string): boolean {
    const timestamp = this.timestamp(value);
    if (timestamp === Number.NEGATIVE_INFINITY) {
      return false;
    }

    if (from) {
      const fromTime = this.timestamp(from);
      if (fromTime !== Number.NEGATIVE_INFINITY && timestamp < fromTime) {
        return false;
      }
    }

    if (to) {
      const toTime = this.timestamp(to);
      if (toTime !== Number.NEGATIVE_INFINITY && timestamp > toTime) {
        return false;
      }
    }

    return true;
  }

  private timestamp(value: string): number {
    const parsed = new Date(value).getTime();
    if (Number.isNaN(parsed)) {
      return Number.NEGATIVE_INFINITY;
    }
    return parsed;
  }

  private normalize(value: string): string {
    return (value ?? '').trim().toLowerCase();
  }

  private resetForm(): void {
    this.inventoryForm.reset({
      id: '',
      number: '',
      warehouse: '',
      responsible: '',
      startedAt: '',
      completedAt: '',
      status: 'draft' as InventoryStatus,
      items: [],
    });
    this.itemsArray.clear();
  }

  private createItemGroup(seed?: Partial<InventoryLinePayload>): InventoryItemFormGroup {
    return this.fb.group({
      catalogItemId: this.fb.control(seed?.catalogItemId ?? '', { validators: [Validators.required] }),
      sku: this.fb.control(seed?.sku ?? '', { validators: [Validators.required] }),
      itemName: this.fb.control(seed?.itemName ?? '', { validators: [Validators.required] }),
      category: this.fb.control(seed?.category ?? '', { validators: [Validators.required] }),
      expectedQuantity: this.fb.control(this.safeNumber(seed?.expectedQuantity), {
        validators: [Validators.required, Validators.min(0)],
      }),
      countedQuantity: this.fb.control(this.safeNumber(seed?.countedQuantity ?? seed?.expectedQuantity), {
        validators: [Validators.required, Validators.min(0)],
      }),
      unit: this.fb.control(seed?.unit ?? '', { validators: [Validators.required] }),
      unitPrice: this.fb.control(this.safeNumber(seed?.unitPrice), {
        validators: [Validators.required, Validators.min(0)],
      }),
    });
  }

  private buildDefaultItems(warehouse: string): InventoryLinePayload[] {
    const rowsSignal = this.warehouseService.list();
    const rows = rowsSignal();
    if (!rows.length) {
      return [];
    }

    const normalizedWarehouse = this.normalize(warehouse);
    const aggregated = new Map<string, InventoryLinePayload>();

    rows.forEach((row) => {
      if (normalizedWarehouse && this.normalize(row.warehouse) !== normalizedWarehouse) {
        return;
      }

      const key = row.productId || row.sku || row.id;
      const existing = aggregated.get(key);

      const expectedQty = this.safeNumber(existing?.expectedQuantity ?? 0) + this.safeNumber(row.qty);
      const countedQty = this.safeNumber(existing?.countedQuantity ?? 0) + this.safeNumber(row.qty);

      aggregated.set(key, {
        catalogItemId: row.productId || row.id,
        sku: row.sku || key,
        itemName: row.name,
        category: row.category,
        expectedQuantity: expectedQty,
        countedQuantity: countedQty,
        unit: row.unit,
        unitPrice: row.price,
      });
    });

    return Array.from(aggregated.values());
  }

  private generateInventoryNumber(): string {
    const documents = this.documents();
    const highest = documents.reduce((max, document) => {
      const match = /INV-(\d+)$/.exec(document.number);
      if (!match) {
        return max;
      }
      const value = Number.parseInt(match[1], 10);
      return Number.isNaN(value) ? max : Math.max(max, value);
    }, 0);

    const next = highest + 1;
    return `INV-${String(next).padStart(4, '0')}`;
  }

  private todayIso(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, '0');
    const day = `${today.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateInput(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private safeNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
      return 0;
    }
    return parsed;
  }

  private toPayload(raw: ReturnType<typeof this.inventoryForm.getRawValue>): UpsertInventoryPayload {
    const items = this.itemsArray.controls.map((control) => {
      const value = control.getRawValue();
      return {
        catalogItemId: value.catalogItemId.trim(),
        sku: value.sku.trim(),
        itemName: value.itemName.trim(),
        category: value.category.trim(),
        expectedQuantity: this.safeNumber(value.expectedQuantity),
        countedQuantity: this.safeNumber(value.countedQuantity),
        unit: value.unit.trim(),
        unitPrice: this.safeNumber(value.unitPrice),
      } satisfies InventoryLinePayload;
    });

    return {
      number: raw.number.trim(),
      warehouse: raw.warehouse.trim(),
      responsible: raw.responsible.trim(),
      startedAt: raw.startedAt,
      completedAt: raw.completedAt ? raw.completedAt : null,
      status: raw.status,
      items,
    };
  }
}










