// src/environments/environment.ts
//
// Для локальной разработки мы явно указываем внешний backend, чтобы клиент
// не пытался обращаться к порту дев-сервера (`http://localhost:4200`).
// Это позволяет без прокси-перенаправления использовать опубликованный API,
// который доступен по адресу 185.251.90.40:8080.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false,
  apiBaseUrl: 'http://185.251.90.40:8080'
};
