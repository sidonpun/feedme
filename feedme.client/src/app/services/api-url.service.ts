import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../tokens/api-base-url.token';

/**
 * Сервис, отвечающий за построение абсолютных ссылок на REST-эндпоинты.
 * Позволяет централизованно менять формат урла и, при необходимости,
 * добавить дополнительные параметры (например, версионирование).
 */
@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  private readonly baseUrl = inject(API_BASE_URL);

  build(path: string): string {
    const trimmedPath = path?.trim();

    if (!trimmedPath) {
      throw new Error('API path segment is required.');
    }

    const sanitizedBase = this.baseUrl.replace(/\/+$/, '');
    const sanitizedPath = trimmedPath.replace(/^\/+/, '');

    if (!sanitizedPath) {
      return sanitizedBase || '/';
    }

    if (!sanitizedBase) {
      return `/${sanitizedPath}`;
    }

    return `${sanitizedBase}/${sanitizedPath}`;
  }
}
