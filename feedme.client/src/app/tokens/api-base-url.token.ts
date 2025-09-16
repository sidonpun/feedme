import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Токен с базовым адресом API. Значение берётся из Angular environment
 * и очищается от завершающих слэшей, чтобы конкатенация путей была безопасной.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const raw = environment.apiBaseUrl?.trim();

    if (raw) {
      return raw.replace(/\/+$/, '');
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (!origin) {
      throw new Error('API base URL is not configured.');
    }

    return origin.replace(/\/+$/, '');
  }
});
