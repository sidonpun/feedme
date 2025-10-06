import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Pipe,
  PipeTransform,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

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
  private readonly store = inject<Store<AppState>>(Store);

  activeTab: 'info' | 'logistics' = 'info';
  private readonly newProductPopupOpen = signal(false);

  readonly isNewProductPopupVisible = this.newProductPopupOpen.asReadonly();
  private readonly catalogItems = toSignal(this.store.select(selectCatalogItems), {
    initialValue: [] as CatalogItem[],
  });
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

  protected get catalogData(): CatalogItem[] {
    return this.catalogItems();
  }
}
