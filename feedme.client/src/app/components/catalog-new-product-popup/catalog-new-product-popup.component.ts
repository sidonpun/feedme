
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CATALOG_FLAG_DEFINITIONS,
  CATALOG_FLAG_FULL_MAP,
  CATALOG_FLAG_ORDER,
  CATALOG_FLAG_SHORT_MAP,
  CatalogFlagCode,
  CatalogFlagDefinition,
} from '../../constants/catalog-flags';

export interface NewProductFormValues {
  name: string;
  type: string;
  code: string;
  category: string;

  unit: string;
  writeoffMethod: string;
  allergens: string;
  packagingRequired: boolean;
  spoilsAfterOpening: boolean;

  supplier: string;
  costEstimate: number;
  taxRate: string;
  unitPrice: number;

  salePrice: number;
  tnved: string;
  isMarked: boolean;

  isAlcohol: boolean;
  alcoholCode: string;
  alcoholStrength: number;
  alcoholVolume: number;
  flagCodes: CatalogFlagCode[];
}

export type NewProductForm = {
  [K in keyof NewProductFormValues]: FormControl<NewProductFormValues[K]>;
};

@Component({
  selector: 'app-catalog-new-product-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-new-product-popup.component.html',
  styleUrls: ['./catalog-new-product-popup.component.css'],
})
export class CatalogNewProductPopupComponent {
  private readonly fb = inject(FormBuilder);

  @Input() errorMessage: string | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<NewProductFormValues>();

  @ViewChild('flagsContainer') private flagsContainer?: ElementRef<HTMLElement>;

  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];
  readonly types = ['Товар', 'Заготовка', 'Упаковка'];
  readonly taxRates = ['Без НДС', '10%', '20%'];
  readonly units = ['кг', 'л', 'шт', 'упаковка'];

  readonly flagOptions = CATALOG_FLAG_DEFINITIONS;
  readonly FLAG_SHORT = CATALOG_FLAG_SHORT_MAP;
  readonly FLAG_FULL = CATALOG_FLAG_FULL_MAP;
  private readonly flagDefinitionMap = new Map<CatalogFlagCode, CatalogFlagDefinition>(
    CATALOG_FLAG_DEFINITIONS.map((definition) => [definition.code, definition])
  );
  readonly maxVisibleFlags = 3;

  
  
  flagsOpen = false;

  form: FormGroup<NewProductForm> = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', Validators.required),
    type: this.fb.nonNullable.control(this.types[0], Validators.required),
    code: this.fb.nonNullable.control('', Validators.required),
    category: this.fb.nonNullable.control('', Validators.required),
    unit: this.fb.nonNullable.control(this.units[0], Validators.required),
    writeoffMethod: this.fb.nonNullable.control('FIFO'),
    allergens: this.fb.nonNullable.control(''),
    packagingRequired: this.fb.nonNullable.control(false),
    spoilsAfterOpening: this.fb.nonNullable.control(false),
    supplier: this.fb.nonNullable.control(''),
    costEstimate: this.fb.nonNullable.control(0),
    taxRate: this.fb.nonNullable.control(this.taxRates[0], Validators.required),
    unitPrice: this.fb.nonNullable.control(0, Validators.required),
    salePrice: this.fb.nonNullable.control(0),
    tnved: this.fb.nonNullable.control(''),
    isMarked: this.fb.nonNullable.control(false),
    isAlcohol: this.fb.nonNullable.control(false),
    alcoholCode: this.fb.nonNullable.control(''),
    alcoholStrength: this.fb.nonNullable.control(0),
    alcoholVolume: this.fb.nonNullable.control(0),
    flagCodes: this.fb.nonNullable.control<CatalogFlagCode[]>([]),
  }) as FormGroup<NewProductForm>;

  constructor() {
    this.form
      .get('isAlcohol')!
      .valueChanges.subscribe((val) => this.toggleAlcoholValidators(val));

    this.form.controls.packagingRequired.valueChanges.subscribe(() => {
      this.syncFlagCodesFromLinkedControls();
    });

    this.form.controls.spoilsAfterOpening.valueChanges.subscribe(() => {
      this.syncFlagCodesFromLinkedControls();
    });
  }

  get selectedFlags(): CatalogFlagCode[] {
    return this.form.controls.flagCodes.value;
  }

  toggleFlag(code: CatalogFlagCode): void {
    const control = this.form.controls.flagCodes;
    const current = control.value ?? [];
    const index = current.indexOf(code);
    const next =
      index >= 0
        ? [...current.slice(0, index), ...current.slice(index + 1)]
        : [...current, code];

    if (!this.areArraysEqual(current, next)) {
      control.setValue(next);
      control.markAsDirty();
      control.markAsTouched();
      this.syncLinkedBooleanControls(next);
    }
  }

  closeFlagsDropdown(): void {
    if (!this.flagsOpen) {
      return;
    }

    this.flagsOpen = false;
  }
  
  onFlagCheckboxChange(event: Event, code: CatalogFlagCode): void {
    event.stopPropagation();
    this.toggleFlag(code);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.flagsOpen) {
      return;
    }

    const target = event.target as Node | null;
    const host = this.flagsContainer?.nativeElement;

    if (host && target && host.contains(target)) {
      return;
    }

    this.closeFlagsDropdown();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeFlagsDropdown();
  }

  openFlagsDropdown(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.flagsOpen = !this.flagsOpen;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.getRawValue());
  }

  close(): void {
    this.cancel.emit();
  }

  private toggleAlcoholValidators(isAlcohol: boolean): void {
    const alcoholControls = ['alcoholCode', 'alcoholStrength', 'alcoholVolume'] as const;

    alcoholControls.forEach((controlName) => {
      const control = this.form.get(controlName);
      if (!control) {
        return;
      }

      if (isAlcohol) {
        control.addValidators(Validators.required);
      } else {
        control.clearValidators();
        control.setValue(typeof control.value === 'number' ? 0 : '');
      }

      control.updateValueAndValidity();
    });
  }

  private syncLinkedBooleanControls(flags: readonly CatalogFlagCode[]): void {
    const requiresPackaging = flags.includes('pack');
    const spoilsAfterOpen = flags.includes('spoil_open');

    if (this.form.controls.packagingRequired.value !== requiresPackaging) {
      this.form.controls.packagingRequired.setValue(requiresPackaging);
    }

    if (this.form.controls.spoilsAfterOpening.value !== spoilsAfterOpen) {
      this.form.controls.spoilsAfterOpening.setValue(spoilsAfterOpen);
    }
  }

  private syncFlagCodesFromLinkedControls(): void {
    const control = this.form.controls.flagCodes;
    const current = control.value ?? [];

    const baseFlags = new Set<CatalogFlagCode>(current);

    baseFlags.delete('pack');
    baseFlags.delete('spoil_open');

    if (this.form.controls.packagingRequired.value) {
      baseFlags.add('pack');
    }

    if (this.form.controls.spoilsAfterOpening.value) {
      baseFlags.add('spoil_open');
    }

    const next = Array.from(baseFlags);

    if (!this.areArraysEqual(current, next)) {
      control.setValue(next);
    }
  }

  private areArraysEqual(left: readonly CatalogFlagCode[], right: readonly CatalogFlagCode[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const leftSorted = [...left].sort();
    const rightSorted = [...right].sort();

    return leftSorted.every((value, index) => value === rightSorted[index]);
  }
}

