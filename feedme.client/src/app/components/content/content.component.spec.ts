import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { ContentComponent } from './content.component';
import { CatalogItem, CatalogService } from '../../services/catalog.service';

describe('ContentComponent', () => {
  let fixture: ComponentFixture<ContentComponent>;
  let component: ContentComponent;
  let catalogService: jasmine.SpyObj<CatalogService>;
  const createItem = (overrides: Partial<CatalogItem>): CatalogItem => ({
    id: 'DEFAULT',
    name: 'Default',
    type: 'Type',
    code: '000',
    category: 'Category',
    unit: 'kg',
    weight: 1,
    writeoffMethod: 'FIFO',
    allergens: '',
    packagingRequired: false,
    spoilsAfterOpening: false,
    supplier: 'Supplier',
    deliveryTime: 1,
    costEstimate: 10,
    taxRate: '10%',
    unitPrice: 12,
    salePrice: 15,
    tnved: '123',
    isMarked: false,
    isAlcohol: false,
    alcoholCode: '',
    alcoholStrength: 0,
    alcoholVolume: 0,
    ...overrides
  });

  beforeEach(async () => {
    catalogService = jasmine.createSpyObj<CatalogService>('CatalogService', ['getAll', 'create', 'delete']);
    catalogService.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ContentComponent],
      providers: [{ provide: CatalogService, useValue: catalogService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ContentComponent);
    component = fixture.componentInstance;
  });

  it('removes the catalog item optimistically and refreshes data on success', () => {
    const existingItems: CatalogItem[] = [
      createItem({ id: 'ITEM-1', name: 'Item 1', code: '001' }),
      createItem({ id: 'ITEM-2', name: 'Item 2', code: '002' })
    ];

    component.catalogData = [...existingItems];
    catalogService.delete.and.returnValue(of(void 0));
    catalogService.getAll.and.returnValue(of([existingItems[1]]));

    component.onCatalogRemove(existingItems[0]);

    expect(catalogService.delete).toHaveBeenCalledTimes(1);
    expect(catalogService.delete).toHaveBeenCalledWith('ITEM-1');
    expect(catalogService.getAll).toHaveBeenCalled();
    expect(component.catalogData).toEqual([existingItems[1]]);
    expect(component.errorMessage).toBeNull();
  });

  it('restores the previous catalog and shows an error when deletion fails', () => {
    const existingItems: CatalogItem[] = [createItem({ id: 'ITEM-1', name: 'Item 1', code: '001' })];

    component.catalogData = [...existingItems];
    catalogService.delete.and.returnValue(throwError(() => new Error('Network error')));

    component.onCatalogRemove(existingItems[0]);

    expect(catalogService.delete).toHaveBeenCalledTimes(1);
    expect(catalogService.delete).toHaveBeenCalledWith('ITEM-1');
    expect(catalogService.getAll).not.toHaveBeenCalled();
    expect(component.catalogData).toEqual(existingItems);
    expect(component.errorMessage).toBe('Не удалось удалить товар. Попробуйте ещё раз.');
  });

  it('rejects deletion requests without a valid identifier', () => {
    const invalidItem = createItem({ id: '   ' });

    component.catalogData = [createItem({ id: 'VALID', name: 'Valid', code: '001' })];

    component.onCatalogRemove(invalidItem);

    expect(catalogService.delete).not.toHaveBeenCalled();
    expect(component.catalogData.length).toBe(1);
    expect(component.errorMessage).toBe('Не удалось удалить товар: отсутствует идентификатор.');
  });
});
