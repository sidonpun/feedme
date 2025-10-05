import type { EnvironmentConfig } from './environment.model';

export type RemoteBackendConfig = {
  baseUrl?: string;
  apiPath?: string;
};

const DEFAULT_API_PATH = '/api';

/**
 * Возвращает объект окружения с собранным абсолютным URL до API.
 * Функция централизует валидацию и нормализацию значений из remote-backend.config.json,
 * чтобы обе конфигурации (dev и prod) использовали единый источник истины
 * и никогда не обращались к localhost по умолчанию.
 */
export function buildEnvironmentConfig(
  config: RemoteBackendConfig,
  overrides?: Partial<EnvironmentConfig>
): EnvironmentConfig {
  const apiBaseUrl = composeApiBaseUrl(config);

  return {
    production: false,
    apiBaseUrl,
    ...overrides
  };
}

export function resolveApiPath(config: RemoteBackendConfig): string {
  return normalizeApiPath(config.apiPath ?? DEFAULT_API_PATH);
}

function composeApiBaseUrl(config: RemoteBackendConfig): string {
  const normalizedBaseUrl = normalizeBaseUrl(config.baseUrl);
  const normalizedApiPath = normalizeApiPath(config.apiPath ?? DEFAULT_API_PATH);

  if (!normalizedApiPath) {
    return normalizedBaseUrl;
  }

  return `${normalizedBaseUrl}${normalizedApiPath}`;
}

function normalizeBaseUrl(baseUrl?: string): string {
  const trimmed = baseUrl?.trim();

  if (!trimmed) {
    throw new Error('Remote backend baseUrl must be provided to build API URLs.');
  }

  return trimmed.replace(/\/+$/, '');
}

function normalizeApiPath(apiPath?: string): string {
  const trimmed = apiPath?.trim();

  if (!trimmed) {
    return '';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}
