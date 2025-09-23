import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { RUNTIME_ENVIRONMENT } from '../tokens/runtime-environment.token';
import type { RuntimeEnvironmentConfig } from './runtime-environment.config';

export function provideRuntimeEnvironment(config: RuntimeEnvironmentConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: RUNTIME_ENVIRONMENT,
      useValue: config
    }
  ]);
}
