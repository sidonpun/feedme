import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Pipe,
  PipeTransform,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { BehaviorSubject, EMPTY, catchError, take, tap } from 'rxjs';

import { NewProductFormValues } from '../catalog-new-product-popup/catalog-new-product-popup.component';
import { CatalogItem, CatalogService } from '../../services/catalog.service';
import { EmptyStateComponent } from '../../warehouse/ui/empty-state.component';
import { CatalogNewProductPopupComponent } from '../catalog-new-product-popup/catalog-new-product-popup.component';

@Pipe({
  name: 'booleanLabel',
  standalone: true,
})
export class BooleanLabelPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return value ? 'Да' : 'Нет';
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
export class CatalogComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  activeTab: 'info' | 'logistics' = 'info';
  private readonly newProductPopupOpen = signal(false);
  private readonly newProductError = signal<string | null>(null);
  private readonly loadError = signal<string | null>(null);

  readonly isNewProductPopupVisible = this.newProductPopupOpen.asReadonly();
  readonly creationErrorMessage = this.newProductError.asReadonly();
  readonly loadErrorMessage = this.loadError.asReadonly();

  private readonly catalogDataSubject = new BehaviorSubject<CatalogItem[]>([]);
  readonly catalogData$ = this.catalogDataSubject.asObservable();


  ngOnInit(): void {
    this.catalogService
      .getAll()

      .pipe(
        take(1),
        tap(data => {
          this.loadError.set(null);
          this.catalogDataSubject.next(data);
        }),
        catchError(() => this.handleError('Не удалось загрузить каталог. Попробуйте ещё раз.'))
      )
      .subscribe();

  }

  /** Открывает модальное окно создания товара */
  openNewProductPopup(): void {
    this.newProductError.set(null);
    this.newProductPopupOpen.set(true);
  }

  /** Закрывает модальное окно создания товара */
  closeNewProductPopup(): void {
    this.newProductPopupOpen.set(false);
    this.newProductError.set(null);
  }

  /** Добавляет новый товар в каталог */
  addProduct(item: NewProductFormValues): void {
    const payload: Omit<CatalogItem, 'id'> = {
      ...item,
      weight: 0,
      deliveryTime: 0,
    };

    this.catalogService
      .create(payload)
      .pipe(
        take(1),
        tap(created => {
          const updated = [...this.catalogDataSubject.value, created];
          this.catalogDataSubject.next(updated);

          this.loadError.set(null);
          this.newProductError.set(null);
          this.newProductPopupOpen.set(false);
        }),
        catchError(() => this.handleCreateError('Не удалось сохранить товар. Попробуйте ещё раз.'))
      )
      .subscribe();
  }

  private handleError(message: string) {
    this.loadError.set(message);
    return EMPTY;

  }

  private handleCreateError(message: string) {
    this.newProductError.set(message);
    return EMPTY;
  }
}
