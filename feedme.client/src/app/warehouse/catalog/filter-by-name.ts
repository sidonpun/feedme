/**
 * Фильтрует элементы по подстроке в поле `name`, сохраняя исходный порядок.
 * Логика вынесена в отдельный модуль для переиспользования в других частях приложения.
 */
export function filterByName<T extends { name: string }>(
  items: readonly T[],
  query: string,
  locale?: string | string[]
): readonly T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter(item => item.name.toLocaleLowerCase(locale).includes(normalizedQuery));
}
