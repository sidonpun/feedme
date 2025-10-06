import { CatalogState, catalogFeatureKey } from './catalog/catalog.reducer';

/**
 * Корневое состояние хранилища приложения.
 *
 * Мы описываем структуру стора явно, чтобы получать строгую типизацию
 * при обращении к NgRx Store через inject(). Это позволяет редактору и
 * компилятору подсказывать доступные свойства и предотвращает ошибки
 * вроде "dispatch/select отсутствует у unknown".
 */
export interface AppState {
  readonly [catalogFeatureKey]: CatalogState;
}
