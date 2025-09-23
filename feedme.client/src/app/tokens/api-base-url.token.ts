import { inject, InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';
import { RUNTIME_ENVIRONMENT } from './runtime-environment.token';

/**
 * Токен с базовым адресом API. Значение берётся из Angular environment
 * и очищается от завершающих слэшей, чтобы конкатенация путей была безопасной.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const runtimeConfig = inject(RUNTIME_ENVIRONMENT);
    const runtimeBaseUrl = runtimeConfig.apiBaseUrl?.trim();

    if (runtimeBaseUrl) {
      return trimTrailingSlashes(runtimeBaseUrl);
    }

    const raw = environment.apiBaseUrl?.trim();

    if (raw) {
      return trimTrailingSlashes(raw);
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (!origin) {
      throw new Error('API base URL is not configured.');
    }

    return trimTrailingSlashes(origin);
  }
});

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}
