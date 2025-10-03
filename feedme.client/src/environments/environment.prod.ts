// src/environments/environment.prod.ts
//
// Продакшен-сборка также использует origin, на котором размещено приложение.
// Это позволяет без дополнительных настроек деплоить фронтенд вместе с backend
// на один домен и избегать лишних CORS-настроек.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: true
};
