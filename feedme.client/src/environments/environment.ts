// src/environments/environment.ts
//
// Локальная сборка обращается напрямую к удалённому backend.
// Это гарантирует, что разработка ведётся в тех же условиях, что и production,
// и запросы не будут направляться на несуществующий локальный сервер.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: 'http://185.251.90.40:8080'
};
