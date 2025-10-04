import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogService } from './catalog.service';
import { ApiUrlService } from './api-url.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CatalogService,
        {
          provide: ApiUrlService,
          useValue: {
            build: (path: string) => `https://api.test/api/${path.replace(/^\/+/, '')}`
          }
        }
      ]
    });

    service = TestBed.inject(CatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('retries loading catalog data when the backend is temporarily unavailable', fakeAsync(() => {
    let response: unknown;
    let errorResponse: unknown;

    service.getAll().subscribe({
      next: data => (response = data),
      error: error => (errorResponse = error)
    });

    const firstAttempt = http.expectOne('https://api.test/api/catalog');
    firstAttempt.error(new ProgressEvent('connection-refused'), { status: 0, statusText: 'Unknown Error' });

    tick(250);

    const secondAttempt = http.expectOne('https://api.test/api/catalog');
    secondAttempt.error(new ProgressEvent('connection-refused'), { status: 0, statusText: 'Unknown Error' });

    tick(500);

    const thirdAttempt = http.expectOne('https://api.test/api/catalog');
    const payload = [
      {
        id: 'CAT-1',
        name: 'Test Item',
        type: 'Ingredient',
        code: '001',
        category: 'Test',
        unit: 'kg',
        weight: 1,
        writeoffMethod: 'auto',
        allergens: 'none',
        packagingRequired: false,
        spoilsAfterOpening: false,
        supplier: 'Test Supplier',
        deliveryTime: 1,
        costEstimate: 10,
        taxRate: '0%',
        unitPrice: 12,
        salePrice: 15,
        tnved: '123',
        isMarked: false,
        isAlcohol: false,
        alcoholCode: '',
        alcoholStrength: 0,
        alcoholVolume: 0
      }
    ];
    thirdAttempt.flush(payload);

    expect(response).toEqual(payload);
    expect(errorResponse).toBeUndefined();
  }));

  it('retries when the backend responds with a gateway timeout', fakeAsync(() => {
    let response: unknown;
    let errorResponse: unknown;

    service.getAll().subscribe({
      next: data => (response = data),
      error: error => (errorResponse = error)
    });

    const initialAttempt = http.expectOne('https://api.test/api/catalog');
    initialAttempt.flush(
      { message: 'Upstream timeout' },
      { status: 504, statusText: 'Gateway Timeout' }
    );

    tick(250);

    const retryAttempt = http.expectOne('https://api.test/api/catalog');
    retryAttempt.flush([], { status: 200, statusText: 'OK' });

    expect(response).toEqual([]);
    expect(errorResponse).toBeUndefined();
  }));

  it('does not retry when the backend returns a client error', () => {
    let receivedError: unknown;

    service.getAll().subscribe({
      next: fail,
      error: error => (receivedError = error)
    });

    const request = http.expectOne('https://api.test/api/catalog');
    request.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

    expect(receivedError).toBeTruthy();
  });

  it('issues a DELETE request with the normalized identifier', () => {
    service.delete('  CAT-42  ').subscribe({
      next: response => expect(response).toBeNull(),
      error: fail
    });

    const request = http.expectOne('https://api.test/api/catalog/CAT-42');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('emits an error when identifier is missing', () => {
    service.delete('   ').subscribe({
      next: () => fail('Expected the call to fail for empty identifier'),
      error: error => expect(error.message).toContain('identifier')
    });
  });
});
