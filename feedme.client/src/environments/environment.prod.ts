// src/environments/environment.prod.ts
//
// Продакшен-сборка сразу направляет запросы на внешний backend без прокси.
// Это гарантирует, что опубликованный фронтенд и backend взаимодействуют
// через один и тот же домен 185.251.90.40:8080.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: true,
  apiBaseUrl: 'http://185.251.90.40:8080'
};
