// src/environments/environment.prod.ts
//
// Продакшен-сборка также использует фиксированный адрес API, который
// развёрнут на публичном сервере приложения.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl: 'http://185.251.90.40:8080'
};
