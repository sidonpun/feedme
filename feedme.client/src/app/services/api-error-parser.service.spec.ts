import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { ApiErrorParserService } from './api-error-parser.service';
import { ApiRequestError } from './api-request-error';

describe('ApiErrorParserService', () => {
  let service: ApiErrorParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiErrorParserService);
  });

  describe('create', () => {
    it('should reuse existing ApiRequestError instances', () => {
      const existing = new ApiRequestError(
        { method: 'POST', url: 'https://api.test/resource', payloadPreview: null },
        500,
        'Internal Server Error',
        'Ошибка',
        [],
        null,
      );

      const result = service.create({ method: 'POST', url: 'https://api.test/resource', error: existing });

      expect(result).toBe(existing);
    });

    it('should enrich server errors with diagnostics metadata', () => {
      jasmine.clock().install();
      const fixedNow = new Date('2024-05-16T10:00:00.000Z');
      jasmine.clock().mockDate(fixedNow);

      const headers = new HttpHeaders({
        'x-request-id': 'req-42',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        'retry-after': '120',
      });

      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: 'https://api.test/resource?id=1',
        error: { message: 'Unhandled exception', detail: 'Stack trace' },
        headers,
      });

      const result = service.create({
        method: 'POST',
        url: 'https://api.test/resource',
        payload: { id: 1 },
        error: httpError,
      });

      jasmine.clock().uninstall();

      expect(result.context.method).toBe('POST');
      expect(result.context.url).toBe('https://api.test/resource');
      expect(result.details).toEqual(
        jasmine.arrayContaining([
          'Метод: POST',
          'URL: https://api.test/resource',
          'Тело запроса: {"id":1}',
          'Время ошибки (UTC): 2024-05-16T10:00:00.000Z',
          `Часовой пояс браузера: ${formatTimezoneOffsetForTest(fixedNow)}`,
          'Фактический URL: https://api.test/resource?id=1',
          'Код статуса: 500 (Internal Server Error)',
          'Сообщение сервера: Unhandled exception',
          'Ответ сервера (сырые данные): {"message":"Unhandled exception","detail":"Stack trace"}',
          'Идентификатор запроса (x-request-id): req-42',
          'Идентификатор запроса (traceparent): 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
          'Подсказка: сообщите идентификатор запроса службе поддержки для ускорения диагностики.',
          'Подсказка: сервер рекомендует повторить запрос через 120 секунд.',
        ]),
      );

      expect(result.details.some(detail => detail.startsWith('Сообщение браузера: '))).toBeTrue();
      expect(result.userMessage).toContain('Сервер вернул внутреннюю ошибку');
    });
  });
});

function formatTimezoneOffsetForTest(date: Date): string {
  const totalMinutes = -date.getTimezoneOffset();
  const sign = totalMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(totalMinutes);
  const hours = Math.floor(absolute / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (absolute % 60)
    .toString()
    .padStart(2, '0');

  return `UTC${sign}${hours}:${minutes}`;
}
