import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ReceiptService, CreateReceipt, Receipt } from './receipt.service';
import { API_BASE_URL } from '../tokens/api-base-url.token';

describe('ReceiptService', () => {
  let service: ReceiptService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReceiptService,
        { provide: API_BASE_URL, useValue: 'https://api.test' }
      ]
    });

    service = TestBed.inject(ReceiptService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send typed payload and return created receipt', () => {
    const payload: CreateReceipt = {
      number: 'RCPT-100',
      supplier: 'ООО Поставщик',
      warehouse: 'Главный склад',
      receivedAt: '2024-04-15T00:00:00.000Z',
      items: [
        {
          catalogItemId: 'product-1',
          itemName: 'Помидоры',
          quantity: 5,
          unit: 'кг',
          unitPrice: 150
        }
      ]
    };

    const response: Receipt = {
      id: 'receipt-1',
      number: payload.number,
      supplier: payload.supplier,
      warehouse: payload.warehouse,
      receivedAt: payload.receivedAt,
      items: [
        {
          ...payload.items[0],
          totalCost: payload.items[0].quantity * payload.items[0].unitPrice
        }
      ],
      totalAmount: payload.items[0].quantity * payload.items[0].unitPrice
    };

    let actual: Receipt | undefined;
    service.saveReceipt(payload).subscribe(result => (actual = result));

    const req = httpMock.expectOne('https://api.test/api/receipts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(response);

    expect(actual).toEqual(response);
  });
});
