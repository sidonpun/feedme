import { filterByName } from './filter-by-name';

describe('filterByName', () => {
  const items = [
    { id: '1', name: 'Говядина варёная' },
    { id: '2', name: 'Гороховый суп' },
    { id: '3', name: 'Жареная курица' },
  ];

  it('возвращает исходный список при пустом запросе', () => {
    const result = filterByName(items, '');

    expect(result).toBe(items);
  });

  it('игнорирует регистр и пробелы по краям', () => {
    const result = filterByName(items, '  КуРИ  ');

    expect(result).toEqual([{ id: '3', name: 'Жареная курица' }]);
  });

  it('возвращает пустой массив, если совпадений нет', () => {
    const result = filterByName(items, 'Рыба');

    expect(result).toEqual([]);
  });
});
