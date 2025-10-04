// src/environments/environment.ts
//
// Локальная сборка использует относительный URL API, чтобы прокси dev-сервера
// мог прозрачно перенаправлять запросы на удалённый backend без проблем с CORS.
import type { EnvironmentConfig } from './environment.model';
import remoteBackendConfig from './remote-backend.config.json';

const fallbackApiPath = '/api';
const configuredApiPath = remoteBackendConfig.apiPath?.trim() || fallbackApiPath;

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: configuredApiPath.startsWith('/')
    ? configuredApiPath
    : `/${configuredApiPath}`
};
