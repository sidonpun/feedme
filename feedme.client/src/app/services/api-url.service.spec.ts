import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../tokens/api-base-url.token';
import { ApiUrlService } from './api-url.service';

describe('ApiUrlService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('builds paths relative to the configured base URL', () => {
    TestBed.configureTestingModule({
      providers: [
        ApiUrlService,
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });

    const service = TestBed.inject(ApiUrlService);

    expect(service.build('supplies')).toBe('/api/supplies');
    expect(service.build('/receipts')).toBe('/api/receipts');
  });

  it('returns a leading slash when the base is empty', () => {
    TestBed.configureTestingModule({
      providers: [
        ApiUrlService,
        { provide: API_BASE_URL, useValue: '' },
      ],
    });

    const service = TestBed.inject(ApiUrlService);

    expect(service.build('catalog')).toBe('/catalog');
  });
});
