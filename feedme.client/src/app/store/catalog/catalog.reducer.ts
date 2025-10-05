import { createFeature, createReducer, on } from '@ngrx/store';

import { catalogActions } from './catalog.actions';
import { CatalogItem } from '../../services/catalog.service';

export const catalogCreationStatuses = {
  idle: 'idle',
  pending: 'pending',
  success: 'success',
  failure: 'failure',
} as const;

export type CatalogCreationStatus =
  (typeof catalogCreationStatuses)[keyof typeof catalogCreationStatuses];

export interface CatalogState {
  readonly items: CatalogItem[];
  readonly loading: boolean;
  readonly loaded: boolean;
  readonly loadError: string | null;
  readonly creationStatus: CatalogCreationStatus;
  readonly creationError: string | null;
}

const initialState: CatalogState = {
  items: [],
  loading: false,
  loaded: false,
  loadError: null,
  creationStatus: catalogCreationStatuses.idle,
  creationError: null,
};

export const catalogFeature = createFeature({
  name: 'catalog',
  reducer: createReducer(
    initialState,
    on(catalogActions.loadCatalog, (state, { force }) => {
      if (force) {
        return {
          ...state,
          loading: true,
          loaded: false,
          loadError: null,
        };
      }

      if (state.loaded) {
        return state;
      }

      return {
        ...state,
        loading: true,
        loadError: null,
      };
    }),
    on(catalogActions.loadCatalogSuccess, (state, { items }) => ({
      ...state,
      items,
      loading: false,
      loaded: true,
      loadError: null,
    })),
    on(catalogActions.loadCatalogFailure, (state, { error }) => ({
      ...state,
      loading: false,
      loaded: false,
      loadError: error,
    })),
    on(catalogActions.createCatalogItem, state => ({
      ...state,
      creationStatus: catalogCreationStatuses.pending,
      creationError: null,
    })),
    on(catalogActions.createCatalogItemSuccess, (state, { item }) => ({
      ...state,
      items: [...state.items, item],
      creationStatus: catalogCreationStatuses.success,
      creationError: null,
    })),
    on(catalogActions.createCatalogItemFailure, (state, { error }) => ({
      ...state,
      creationStatus: catalogCreationStatuses.failure,
      creationError: error,
    })),
    on(catalogActions.resetCreationState, state => ({
      ...state,
      creationStatus: catalogCreationStatuses.idle,
      creationError: null,
    }))
  ),
});

export const {
  name: catalogFeatureKey,
  reducer: catalogReducer,
  selectCatalogState,
  selectItems: selectCatalogItems,
  selectLoading: selectCatalogLoading,
  selectLoaded: selectCatalogLoaded,
  selectLoadError: selectCatalogLoadError,
  selectCreationStatus: selectCatalogCreationStatus,
  selectCreationError: selectCatalogCreationError,
} = catalogFeature;
