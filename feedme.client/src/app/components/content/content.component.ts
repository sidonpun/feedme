import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component';
import { InfoCardsWrapperComponent } from '../info-cards-wrapper/info-cards-wrapper.component';
import { NewProductComponent } from '../new-product/new-product.component';

import { SupplyTableComponent } from '../SupplyTableComponent/supply-table.component';
import { StockTableComponent } from '../StockTableComponent/stock-table.component';
import { CatalogTableComponent } from '../CatalogTableComponent/catalog-table.component';

import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WarehouseTabsComponent,
    SupplyControlsComponent,
    InfoCardsWrapperComponent,
    NewProductComponent,
    SupplyTableComponent,
    StockTableComponent,
    CatalogTableComponent
  ],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {
  selectedTab: string = 'Главный склад';
  selectedSupply: 'supplies' | 'stock' = 'supplies';

  supplyData: any[] = [];
  stockData: any[] = [];
  catalogData: any[] = [];

  selectedItem: any = null;
  showNewProductPopup = false;

  constructor(private ws: WarehouseService) { }

  ngOnInit() {
    this.loadWarehouseData();
    this.loadCatalogData();
  }

  setSelectedTab(tab: string) {
    this.selectedTab = tab;
    if (tab === 'Каталог') {
      this.loadCatalogData();
    } else {
      this.loadWarehouseData();
    }
  }

  private loadWarehouseData() {
    this.supplyData = this.ws.getSupplies(this.selectedTab);
    this.stockData = this.ws.getStock(this.selectedTab);
  }

  private loadCatalogData() {
    this.catalogData = this.ws.getCatalog();
  }

  openNewProductPopup() {
    this.showNewProductPopup = true;
  }

  closeNewProductPopup() {
    this.showNewProductPopup = false;
  }

  onNewProductSubmit(item: any) {
    if (this.selectedTab === 'Каталог') {
      this.ws.addCatalog(item);
      this.catalogData = this.ws.getCatalog();
    } else if (this.selectedSupply === 'supplies') {
      this.ws.addSupply(this.selectedTab, item);
      this.supplyData = this.ws.getSupplies(this.selectedTab);
    } else {
      this.ws.addStock(this.selectedTab, item);
      this.stockData = this.ws.getStock(this.selectedTab);
    }
    this.closeNewProductPopup();
  }

  handleSettingsClick(item: any) {
    this.selectedItem = item;
  }

  goToCatalog() {
    this.selectedTab = 'Каталог';
  }

  closeInfoCards() {
    this.selectedItem = null;
  }
}
