// src/environments/environment.ts
//
// Локальная сборка использует относительный путь к backend (`/api`).
// Angular dev-server автоматически проксирует такие запросы на ASP.NET API,
// поэтому не возникает проблем с CORS и не нужно открывать удалённый порт.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false
};
