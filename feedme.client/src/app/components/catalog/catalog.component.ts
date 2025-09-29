import { Component, OnInit, Pipe, PipeTransform, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BehaviorSubject, EMPTY, catchError, take, tap } from 'rxjs';

import { FilterPipe } from '../../pipes/filter.pipe';
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
    FormsModule,
    FilterPipe,
    BooleanLabelPipe,
    EmptyStateComponent,
    CatalogNewProductPopupComponent,
  ],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  activeTab: 'info' | 'logistics' = 'info';
  filter = '';

  showNewProductPopup = false;
  createErrorMessage: string | null = null;

  private readonly catalogDataSubject = new BehaviorSubject<CatalogItem[]>([]);
  readonly catalogData$ = this.catalogDataSubject.asObservable();
  errorMessage: string | null = null;


  ngOnInit(): void {
    this.catalogService
      .getAll()

      .pipe(
        take(1),
        tap(data => this.catalogDataSubject.next(data)),
        catchError(() => this.handleError('Не удалось загрузить каталог. Попробуйте ещё раз.'))
      )
      .subscribe();

  }

  /** Открывает модальное окно создания товара */
  openNewProductPopup(): void {
    this.createErrorMessage = null;
    this.showNewProductPopup = true;
  }

  /** Закрывает модальное окно создания товара */
  closeNewProductPopup(): void {
    this.showNewProductPopup = false;
    this.createErrorMessage = null;
  }

  /** Добавляет новый товар в каталог */
  addProduct(item: NewProductFormValues): void {
    this.catalogService
      .create(item)
      .pipe(
        take(1),
        tap(created => {
          const updated = [...this.catalogDataSubject.value, created];
          this.catalogDataSubject.next(updated);

          this.errorMessage = null;
          this.createErrorMessage = null;
          this.showNewProductPopup = false;
        }),
        catchError(() => this.handleCreateError('Не удалось сохранить товар. Попробуйте ещё раз.'))
      )
      .subscribe();
  }

  private handleError(message: string) {
    this.errorMessage = message;
    return EMPTY;

  }

  private handleCreateError(message: string) {
    this.createErrorMessage = message;
    return EMPTY;
  }
}
