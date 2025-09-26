// src/environments/environment.ts
//
// В режиме разработки API-сервер запускается отдельно от Angular Dev Server,
// поэтому явно указываем его базовый адрес. Это устраняет обращения к
// несуществующему эндпоинту `http://localhost:4200/api` и направляет запросы
// напрямую на ASP.NET Core backend.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: 'http://localhost:5016'
};
