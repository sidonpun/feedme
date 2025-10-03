// src/environments/environment.ts
//
// Локальная сборка использует dev-server proxy, чтобы обращаться к backend
// через тот же origin (http://localhost:4200). Это избавляет от проблем с CORS,
// а также позволяет прозрачно подменять целевой сервер (локальный или удалённый)
// через конфигурацию proxy.conf.js без переписывания клиентского кода.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false
};
