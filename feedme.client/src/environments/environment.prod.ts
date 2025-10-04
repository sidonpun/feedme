// src/environments/environment.prod.ts
//
// Продакшен-сборка использует абсолютный адрес API на боевом сервере.
// Таким образом статические файлы и REST-эндпоинты обслуживаются одним доменом.
import type { EnvironmentConfig } from './environment.model';
import remoteBackendConfig from './remote-backend.config.json';

const fallbackApiPath = '/api';
const configuredApiPath = remoteBackendConfig.apiPath?.trim() || fallbackApiPath;
const normalizedApiPath = configuredApiPath.startsWith('/')
  ? configuredApiPath
  : `/${configuredApiPath}`;

const normalizedBaseUrl = remoteBackendConfig.baseUrl?.trim().replace(/\/+$/, '') ?? '';
const apiBaseUrl = normalizedBaseUrl
  ? `${normalizedBaseUrl}${normalizedApiPath}`
  : normalizedApiPath;

export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl
};
