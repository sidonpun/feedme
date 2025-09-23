import { PopupComponent } from './popup.component';
import { normalizeCatalogItem } from '../../utils/catalog.utils';

describe('PopupComponent', () => {
  let component: PopupComponent;

  beforeEach(() => {
    component = new PopupComponent();
  });

  it('normalizes catalog suggestion and submits numeric payload', () => {
    const rawSuggestion = {
      id: '0001',
      category: 'Заготовка',
      name: 'Банка Coca-cola',
      stock: '25шт',
      price: '$4.95',
      expiryDate: '20/12/2025',
    };

    const suggestion = normalizeCatalogItem(rawSuggestion);

    component.handleSuggestionSelect(suggestion);
    component.supplyDate = '2025-01-01';

    expect(component.stock).toBe(25);
    expect(component.unitPrice).toBe(4.95);
    expect(component.totalCost).toBe(123.75);

    let emittedItem: any;
    component.onAddItem.subscribe(item => emittedItem = item);

    component.handleSubmit();

    expect(emittedItem).toEqual(jasmine.objectContaining({
      name: 'Банка Coca-cola',
      category: 'Заготовка',
      stock: 25,
      unitPrice: 4.95,
      totalCost: 123.75,
      supplyDate: '2025-01-01',
      expiryDate: '2025-12-20'
    }));
    expect(component.stock).toBeNull();
    expect(component.unitPrice).toBeNull();
    expect(component.totalCost).toBeNull();
  });
});
