import { InjectionToken } from '@angular/core';

import type { RuntimeEnvironmentConfig } from '../config/runtime-environment.config';

export const RUNTIME_ENVIRONMENT = new InjectionToken<RuntimeEnvironmentConfig>('RUNTIME_ENVIRONMENT', {
  providedIn: 'root',
  factory: () => ({})
});
