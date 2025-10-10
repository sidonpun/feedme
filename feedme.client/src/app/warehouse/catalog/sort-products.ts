import { Product } from '../shared/models';

export type CatalogSortKey =
  | 'name'
  | 'type'
  | 'sku'
  | 'category'
  | 'unit'
  | 'purchasePrice'
  | 'salePrice'
  | 'supplierMain';

export type SortDirection = 'asc' | 'desc';

export interface CatalogSortState {
  readonly key: CatalogSortKey;
  readonly direction: SortDirection;
}

type SortableValue = string | number | null;
type PresentSortableValue = Exclude<SortableValue, null>;

const EXTRACTORS: Record<CatalogSortKey, (product: Product) => SortableValue> = {
  name: product => product.name,
  type: product => product.type,
  sku: product => product.sku,
  category: product => product.category,
  unit: product => product.unit,
  purchasePrice: product => product.purchasePrice,
  salePrice: product => product.salePrice,
  supplierMain: product => product.supplierMain,
};

export function sortProducts(
  products: readonly Product[],
  sortState: CatalogSortState
): readonly Product[] {
  const productsCopy = [...products];
  const extractValue = EXTRACTORS[sortState.key];
  const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

  productsCopy.sort((left, right) => {
    const leftValue = extractValue(left);
    const rightValue = extractValue(right);

    if (leftValue === null || leftValue === undefined) {
      return rightValue === null || rightValue === undefined ? 0 : 1;
    }

    if (rightValue === null || rightValue === undefined) {
      return -1;
    }

    const comparisonResult = comparePresentSortableValues(leftValue, rightValue);

    return comparisonResult * directionMultiplier;
  });

  return productsCopy;
}

function comparePresentSortableValues(left: PresentSortableValue, right: PresentSortableValue): number {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  const leftText = String(left);
  const rightText = String(right);

  return leftText.localeCompare(rightText, 'ru-RU', {
    sensitivity: 'accent',
    numeric: true,
  });
}
