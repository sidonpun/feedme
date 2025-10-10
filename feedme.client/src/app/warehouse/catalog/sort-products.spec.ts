import { Product } from '../shared/models';
import { CatalogSortState, sortProducts } from './sort-products';

describe('sortProducts', () => {
  const createProduct = (overrides: Partial<Product>): Product => ({
    id: 'id-default',
    name: 'Название',
    type: 'Товар',
    sku: 'SKU',
    category: 'Категория',
    unit: 'кг',
    unitWeight: null,
    writeoff: 'FIFO',
    allergens: null,
    needsPacking: false,
    perishableAfterOpen: false,
    supplierMain: null,
    leadTimeDays: null,
    costEst: null,
    vat: null,
    purchasePrice: null,
    salePrice: null,
    tnvCode: null,
    marked: false,
    alcohol: false,
    alcoholCode: null,
    alcoholStrength: null,
    alcoholVolume: null,
    ...overrides,
  });

  it('сортирует по названию по возрастанию', () => {
    const products = [
      createProduct({ id: '1', name: 'Яблоко' }),
      createProduct({ id: '2', name: 'Апельсин' }),
      createProduct({ id: '3', name: 'Груша' }),
    ];

    const result = sortProducts(products, { key: 'name', direction: 'asc' });

    expect(result.map(product => product.id)).toEqual(['2', '3', '1']);
  });

  it('сортирует по цене закупки по убыванию, размещая null последними', () => {
    const products = [
      createProduct({ id: '1', purchasePrice: 150 }),
      createProduct({ id: '2', purchasePrice: null }),
      createProduct({ id: '3', purchasePrice: 95 }),
    ];

    const sortState: CatalogSortState = { key: 'purchasePrice', direction: 'desc' };
    const result = sortProducts(products, sortState);

    expect(result.map(product => product.id)).toEqual(['1', '3', '2']);
  });

  it('сортирует по поставщику по убыванию', () => {
    const products = [
      createProduct({ id: '1', supplierMain: 'Бета' }),
      createProduct({ id: '2', supplierMain: 'Альфа' }),
      createProduct({ id: '3', supplierMain: 'Гамма' }),
    ];

    const result = sortProducts(products, { key: 'supplierMain', direction: 'desc' });

    expect(result.map(product => product.id)).toEqual(['3', '1', '2']);
  });

  it('не мутирует исходный массив', () => {
    const products = [
      createProduct({ id: '1', name: 'Банан' }),
      createProduct({ id: '2', name: 'Абрикос' }),
    ];
    const snapshot = [...products];

    const result = sortProducts(products, { key: 'name', direction: 'asc' });

    expect(products).toEqual(snapshot);
    expect(result).not.toBe(products);
  });
});
