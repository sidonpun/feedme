// src/environments/environment.prod.ts
//

// Продакшен-сборка использует тот же механизм сборки URL, что и dev,
// но явно включает флаг production.

import type { EnvironmentConfig } from './environment.model';
import { buildEnvironmentConfig } from './api-base-url.builder';
import remoteBackendConfig from './remote-backend.config.json';


export const environment: EnvironmentConfig = buildEnvironmentConfig(remoteBackendConfig, { production: true });

