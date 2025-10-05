import { enableProdMode, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app-routing.module';
import { environment } from './environments/environment';
import { catalogFeature } from './app/store/catalog/catalog.reducer';
import { CatalogEffects } from './app/store/catalog/catalog.effects';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule
    ),
    provideRouter(appRoutes),
    provideStore(),
    provideState(catalogFeature),
    provideEffects(CatalogEffects),
    ...(environment.production
      ? []
      : [
          provideStoreDevtools({
            maxAge: 25,
            logOnly: environment.production,
            connectInZone: true,
          }),
        ]),
  ]
}).catch(err => console.error(err));
