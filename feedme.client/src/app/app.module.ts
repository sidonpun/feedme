// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  RouterModule,
  Routes
} from '@angular/router';

import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { ContentComponent } from './components/content/content.component';
import { TableControlsComponent } from './components/table-controls/table-controls.component';
import { WarehouseComponent } from './components/warehouse/warehouse.component';
import { NewProductComponent } from './components/new-product/new-product.component';
import { EditStockPopupComponent } from './components/edit-stock-popup/edit-stock-popup.component';
import { InfoCardsWrapperComponent } from './components/info-cards-wrapper/info-cards-wrapper.component';

const routes: Routes = [
  // … ваши маршруты
];

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    HeaderComponent,
    ContentComponent,
    TableControlsComponent,
    WarehouseComponent,
    NewProductComponent,
    EditStockPopupComponent,
    InfoCardsWrapperComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
