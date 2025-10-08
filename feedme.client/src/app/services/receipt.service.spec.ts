import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../tokens/api-base-url.token';
import { CreateReceipt, ReceiptService } from './receipt.service';

describe('ReceiptService', () => {
  let service: ReceiptService;
  let httpMock: HttpTestingController;
  const apiBase = 'http://185.251.90.40:8080/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReceiptService,
        { provide: API_BASE_URL, useValue: apiBase },
      ],
    });

    service = TestBed.inject(ReceiptService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createPayload(overrides: Partial<CreateReceipt> = {}): CreateReceipt {
    const base: CreateReceipt = {
      number: 'RCPT-100',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00.000Z',
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning',
        },
      ],
    } satisfies CreateReceipt;

    return { ...base, ...overrides };
  }

  function createReceiptResponse(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'receipt-1',
      number: 'RCPT-100',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00Z',
      totalAmount: 750,
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          totalCost: 750,
          expiryDate: '2024-04-25T00:00:00Z',
          status: 'warning',
        },
      ],
      ...overrides,
    };
  }

  it('loads receipts from the API and maps numeric fields', () => {
    const response = [createReceiptResponse()];
    let result: unknown;

    service.getAll().subscribe((receipts) => {
      result = receipts;
    });

    const request = httpMock.expectOne(`${apiBase}/receipts`);
    expect(request.request.method).toBe('GET');
    request.flush(response);

    expect(result).toEqual([
      {
        id: 'receipt-1',
        number: 'RCPT-100',
        supplier: 'ООО Поставщик',
        warehouse: 'Главный склад',
        responsible: 'Не назначен',
        receivedAt: '2024-04-15T00:00:00.000Z',
        totalAmount: 750,
        items: [
          {
            catalogItemId: 'product-1',
            sku: 'PRD-001',
            itemName: 'Помидоры',
            category: 'Овощи',
            quantity: 5,
            unit: 'кг',
            unitPrice: 150,
            totalCost: 750,
            expiryDate: '2024-04-25T00:00:00.000Z',
            status: 'warning',
          },
        ],
      },
    ]);
  });

  it('creates a receipt via POST and normalizes the payload', () => {
    const payload = createPayload();
    let result: unknown;

    service.saveReceipt(payload).subscribe((receipt) => {
      result = receipt;
    });

    const request = httpMock.expectOne(`${apiBase}/receipts`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      number: 'RCPT-100',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00.000Z',
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning',
        },
      ],
    });

    request.flush(createReceiptResponse());

    expect(result).toEqual({
      id: 'receipt-1',
      number: 'RCPT-100',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00.000Z',
      totalAmount: 750,
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          totalCost: 750,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning',
        },
      ],
    });
  });

  it('updates a receipt with PUT and keeps the identifier consistent', () => {
    const payload = createPayload({ number: 'RCPT-200' });
    let result: unknown;

    service.updateReceipt('  receipt-200  ', payload).subscribe((receipt) => {
      result = receipt;
    });

    const request = httpMock.expectOne(`${apiBase}/receipts/receipt-200`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      id: 'receipt-200',
      number: 'RCPT-200',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00.000Z',
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning',
        },
      ],
    });

    request.flush(createReceiptResponse({ id: 'receipt-200', number: 'RCPT-200' }));

    expect(result).toEqual({
      id: 'receipt-200',
      number: 'RCPT-200',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      responsible: 'Не назначен',
      receivedAt: '2024-04-15T00:00:00.000Z',
      totalAmount: 750,
      items: [
        {
          catalogItemId: 'product-1',
          sku: 'PRD-001',
          itemName: 'Помидоры',
          category: 'Овощи',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150,
          totalCost: 750,
          expiryDate: '2024-04-25T00:00:00.000Z',
          status: 'warning',
        },
      ],
    });
  });

  it('deletes a receipt by identifier', () => {
    service.deleteReceipt(' receipt-300 ').subscribe();

    const request = httpMock.expectOne(`${apiBase}/receipts/receipt-300`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('throws an error when deleting without an identifier', () => {
    expect(() => service.deleteReceipt('   ')).toThrowError('Receipt identifier is required.');
  });
});
