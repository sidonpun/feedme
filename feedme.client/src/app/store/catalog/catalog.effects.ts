import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, map, of, switchMap, withLatestFrom } from 'rxjs';

import { catalogActions } from './catalog.actions';
import { CatalogService } from '../../services/catalog.service';
import { selectCatalogLoaded } from './catalog.reducer';
import { AppState } from '../app.state';

@Injectable()
export class CatalogEffects {
  private readonly actions$ = inject(Actions);
  private readonly catalogService = inject(CatalogService);
  private readonly store = inject<Store<AppState>>(Store);

  readonly loadCatalog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(catalogActions.loadCatalog),
      withLatestFrom(this.store.select(selectCatalogLoaded)),
      filter(([action, loaded]) => Boolean(action.force) || !loaded),
      switchMap(([_, __]) =>
        this.catalogService.getAll().pipe(
          map(items => catalogActions.loadCatalogSuccess({ items })),
          catchError(() =>
            of(
              catalogActions.loadCatalogFailure({
                error: 'Не удалось загрузить каталог. Попробуйте ещё раз.',
              })
            )
          )
        )
      )
    )
  );

  readonly createCatalogItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(catalogActions.createCatalogItem),
      switchMap(({ item }) =>
        this.catalogService.create(item).pipe(
          map(created => catalogActions.createCatalogItemSuccess({ item: created })),
          catchError(() =>
            of(
              catalogActions.createCatalogItemFailure({
                error: 'Не удалось сохранить товар. Попробуйте ещё раз.',
              })
            )
          )
        )
      )
    )
  );
}
