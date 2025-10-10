// src/environments/environment.ts
//

// Dev-окружение намеренно работает с тем же удалённым API, что и продакшен,
// чтобы исключить любые расхождения между средами и предотвратить обращения
// к localhost. Благодаря этому все HTTP-запросы выполняются напрямую к
// серверу 185.251.90.40.

import type { EnvironmentConfig } from './environment.model';
import {
  buildEnvironmentConfig,
  resolveApiPath,
  type RemoteBackendConfig
} from './api-base-url.builder';
import remoteBackendConfigJson from './remote-backend.config.json';

const remoteBackendConfig = remoteBackendConfigJson satisfies RemoteBackendConfig;
const remoteEnvironment = buildEnvironmentConfig(remoteBackendConfig);

export const environment: EnvironmentConfig = {
  ...remoteEnvironment,
  apiBaseUrl: resolveApiPath(remoteBackendConfig),
  production: false
};

