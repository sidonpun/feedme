import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { CatalogItem } from '../../services/catalog.service';

export const catalogActions = createActionGroup({
  source: 'Catalog',
  events: {
    'Load Catalog': props<{ force?: boolean }>(),
    'Load Catalog Success': props<{ items: CatalogItem[] }>(),
    'Load Catalog Failure': props<{ error: string }>(),
    'Create Catalog Item': props<{ item: Omit<CatalogItem, 'id'> }>(),
    'Create Catalog Item Success': props<{ item: CatalogItem }>(),
    'Create Catalog Item Failure': props<{ error: string }>(),
    'Reset Creation State': emptyProps(),
  },
});
