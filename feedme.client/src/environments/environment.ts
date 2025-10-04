// src/environments/environment.ts
//
// Dev-окружение тоже обращается к удалённому серверу.
// Это исключает любые обращения к localhost и позволяет тестировать приложение
// на том же API, что и в продакшене.
import type { EnvironmentConfig } from './environment.model';
import { buildEnvironmentConfig } from './api-base-url.builder';
import remoteBackendConfig from './remote-backend.config.json';

export const environment: EnvironmentConfig = buildEnvironmentConfig(remoteBackendConfig);
