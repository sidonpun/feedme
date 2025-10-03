// src/environments/environment.ts
//
// Локальная сборка работает с backend, развёрнутым на удалённом сервере.
// Чтобы избавить разработчиков от ручной настройки адресов при запуске
// `ng serve`, сразу используем продакшеновый endpoint.
import type { EnvironmentConfig } from './environment.model';
import remoteBackendConfig from './remote-backend.config.json';

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: remoteBackendConfig.baseUrl
};
