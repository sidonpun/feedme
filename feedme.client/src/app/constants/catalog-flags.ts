export type CatalogFlagCode = 'pack' | 'spoil_open' | 'fragile' | 'temp';

export interface CatalogFlagDefinition {
  readonly code: CatalogFlagCode;
  readonly short: string;
  readonly full: string;
}

export const CATALOG_FLAG_DEFINITIONS: readonly CatalogFlagDefinition[] = [
  {
    code: 'pack',
    short: 'Фас.',
    full: 'Требует фасовки',
  },
  {
    code: 'spoil_open',
    short: 'После вскр.',
    full: 'Портится после вскрытия',
  },
  {
    code: 'fragile',
    short: 'Хрупк.',
    full: 'Хрупкий товар',
  },
  {
    code: 'temp',
    short: 'Темп.',
    full: 'Требует температурный режим',
  },
] as const;

export const CATALOG_FLAG_SHORT_MAP: Record<CatalogFlagCode, string> =
  CATALOG_FLAG_DEFINITIONS.reduce(
    (acc, definition) => {
      acc[definition.code] = definition.short;
      return acc;
    },
    {} as Record<CatalogFlagCode, string>
  );

export const CATALOG_FLAG_FULL_MAP: Record<CatalogFlagCode, string> =
  CATALOG_FLAG_DEFINITIONS.reduce(
    (acc, definition) => {
      acc[definition.code] = definition.full;
      return acc;
    },
    {} as Record<CatalogFlagCode, string>
  );

export const CATALOG_FLAG_ORDER = CATALOG_FLAG_DEFINITIONS.reduce(
  (acc, definition, index) => acc.set(definition.code, index),
  new Map<CatalogFlagCode, number>()
);
