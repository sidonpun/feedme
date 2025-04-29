import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ContentComponent } from './components/content/content.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { PopupComponent } from './components/popup/popup.component';
import { InfoCardsComponent } from './components/info-cards/info-cards.component';
import { InfoCardsWrapperComponent } from './components/info-cards-wrapper/info-cards-wrapper.component';
import { WarehouseTabsComponent } from './components/warehouse-tabs/warehouse-tabs.component';
import { WarehouseTableComponent } from './components/warehouse-table/warehouse-table.component';
import { HistoryPopupComponent } from './components/history-popup/history-popup.component';
import { SupplyControlsComponent } from './components/supply-controls/supply-controls.component';
import { EditStockPopupComponent } from './components/edit-stock-popup/edit-stock-popup.component';
import { NewProductComponent } from './components/new-product/new-product.component';
import { TableControlsComponent } from './components/table-controls/table-controls.component';
import { WarehouseComponent } from './components/warehouse/warehouse.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([]),
    AppComponent,
    ContentComponent,
    SidebarComponent,
    HeaderComponent,
    CatalogComponent,
    PopupComponent,
    InfoCardsComponent,
    InfoCardsWrapperComponent,
    WarehouseTabsComponent,
    WarehouseTableComponent,
    HistoryPopupComponent,
    SupplyControlsComponent,
    EditStockPopupComponent,
    NewProductComponent,
    TableControlsComponent,
    WarehouseComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
