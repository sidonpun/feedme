import { HttpClientModule } from '@angular/common/http';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app-routing.module';
import { loadRuntimeEnvironmentConfig } from './app/config/runtime-environment.config';
import { provideRuntimeEnvironment } from './app/config/runtime-environment.providers';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

async function main(): Promise<void> {
  const runtimeEnvironment = await loadRuntimeEnvironmentConfig();

  await bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule
      ),
      provideRouter(appRoutes),
      provideRuntimeEnvironment(runtimeEnvironment)
    ]
  });
}

main().catch(err => console.error(err));
