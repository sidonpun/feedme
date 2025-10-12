/**
 * Фильтрует элементы по подстроке в полях `name` и, при наличии, `sku`, сохраняя исходный порядок.
 * Логика вынесена в отдельный модуль для переиспользования в других частях приложения.
 */
export function filterByName<
  T extends { name: string } & Partial<{ sku: string | number | null | undefined }>,
>(
  items: readonly T[],
  query: string,
  locale?: string | string[]
): readonly T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter(item => {
    if (item.name.toLocaleLowerCase(locale).includes(normalizedQuery)) {
      return true;
    }

    const rawSku = item.sku;

    if (rawSku === null || rawSku === undefined) {
      return false;
    }

    const normalizedSku = String(rawSku).trim().toLocaleLowerCase(locale);

    if (!normalizedSku) {
      return false;
    }

    return normalizedSku.includes(normalizedQuery);
  });
}
