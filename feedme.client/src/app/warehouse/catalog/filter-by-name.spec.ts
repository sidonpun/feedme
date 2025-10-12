import { filterByName } from './filter-by-name';

describe('filterByName', () => {
  const items = [
    { id: '1', name: 'Говядина варёная', sku: 'MEAT-001' },
    { id: '2', name: 'Гороховый суп', sku: 'SOUP-777' },
    { id: '3', name: 'Жареная курица', sku: 'CHICK-123' },
    { id: '4', name: 'Соус барбекю' },
    { id: '5', name: 'Томатная паста', sku: '   ' },
  ];

  it('возвращает исходный список при пустом запросе', () => {
    const result = filterByName(items, '');

    expect(result).toBe(items);
  });

  it('игнорирует регистр и пробелы по краям', () => {
    const result = filterByName(items, '  КуРИ  ');

    expect(result).toEqual([{ id: '3', name: 'Жареная курица', sku: 'CHICK-123' }]);
  });

  it('возвращает пустой массив, если совпадений нет', () => {
    const result = filterByName(items, 'Рыба');

    expect(result).toEqual([]);
  });

  it('находит товары по совпадению в SKU', () => {
    const result = filterByName(items, '  soup-7 ');

    expect(result).toEqual([{ id: '2', name: 'Гороховый суп', sku: 'SOUP-777' }]);
  });

  it('не учитывает SKU, состоящий только из пробелов', () => {
    const result = filterByName(items, '005');

    expect(result).toEqual([]);
  });
});
