// src/environments/environment.prod.ts
//
// Продакшен-сборка использует тот же origin, что и фронт. При необходимости
// можно задать `apiBaseUrl` и направить запросы на внешний backend.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: true
};
