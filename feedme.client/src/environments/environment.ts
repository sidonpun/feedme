// src/environments/environment.ts
//
// Локальная сборка использует origin приложения и проксируется до нужного backend
// через `proxy.conf.js`. Благодаря этому браузер всегда обращается к API с того же
// домена, что и фронтенд, и проблемы с CORS не возникают даже при разработке.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false
};
