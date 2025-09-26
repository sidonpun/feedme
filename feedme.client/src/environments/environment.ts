// src/environments/environment.ts
//
// Для локальной разработки мы полагаемся на прокси-конфигурацию Angular,
// которая перенаправляет запросы с origin дев-сервера (`http://localhost:4200`)
// на актуальный backend, независимо от того, запускается ли он через `dotnet`
// или внутри Docker. Поэтому базовый адрес API здесь не задаём — токен
// `API_BASE_URL` автоматически возьмёт origin окна браузера.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false
};
