// src/environments/environment.prod.ts
//

// Продакшен-сборка использует тот же механизм сборки URL, что и dev,
// но явно включает флаг production.

import type { EnvironmentConfig } from './environment.model';
import {
  buildEnvironmentConfig,
  type RemoteBackendConfig
} from './api-base-url.builder';
import remoteBackendConfigJson from './remote-backend.config.json';

const remoteBackendConfig = remoteBackendConfigJson satisfies RemoteBackendConfig;

export const environment: EnvironmentConfig = buildEnvironmentConfig(remoteBackendConfig, {
  production: true
});

