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
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }
}
