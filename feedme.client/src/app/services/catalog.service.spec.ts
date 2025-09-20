import { TestBed } from '@angular/core/testing';
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
            build: (path: string) => `https://api.test${path}`
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
