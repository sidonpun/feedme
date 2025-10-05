// src/environments/environment.ts
//

// Dev-окружение использует прокси Angular CLI, чтобы перенаправлять запросы
// к удалённому серверу через тот же origin. Это избавляет от проблем с CORS,
// сохраняя работу с тем же API, что и в продакшене.

import type { EnvironmentConfig } from './environment.model';
import {
  buildEnvironmentConfig,
  resolveApiPath,
  type RemoteBackendConfig
} from './api-base-url.builder';
import remoteBackendConfigJson from './remote-backend.config.json';

const remoteBackendConfig = remoteBackendConfigJson satisfies RemoteBackendConfig;
const remoteEnvironment = buildEnvironmentConfig(remoteBackendConfig);
const proxyAwareApiBaseUrl = resolveApiPath(remoteBackendConfig) || '/';

export const environment: EnvironmentConfig = {
  ...remoteEnvironment,
  apiBaseUrl: proxyAwareApiBaseUrl
};

