// src/environments/environment.ts
//
// В режиме разработки базовый адрес API берём из origin браузера. Это
// гарантирует, что прокси или локальный backend будут использоваться без
// дополнительной конфигурации.
import type { EnvironmentConfig } from './environment.model';

export const environment: EnvironmentConfig = {
  production: false
};
