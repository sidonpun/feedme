import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component';
import { InfoCardsWrapperComponent } from '../info-cards-wrapper/info-cards-wrapper.component';
import { PopupComponent } from '../popup/popup.component';

import { SupplyTableComponent } from '../supply-table/supply-table.component';
import { StockTableComponent } from '../stock-table/stock-table.component';
import { CatalogTableComponent } from '../catalog-table/catalog-table.component';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WarehouseTabsComponent,
    SupplyControlsComponent,
    InfoCardsWrapperComponent,
    SupplyTableComponent,
    StockTableComponent,
    CatalogTableComponent,
    PopupComponent
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
  showPopup = false;

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
    const supKey = `warehouseSupplies_${this.selectedTab}`;
    const stkKey = `warehouseStock_${this.selectedTab}`;
    this.supplyData = JSON.parse(localStorage.getItem(supKey) || '[]');
    this.stockData = JSON.parse(localStorage.getItem(stkKey) || '[]');
  }

  private loadCatalogData() {
    this.catalogData = JSON.parse(localStorage.getItem('catalogData') || '[]');
  }

  handleAddItem(newItem: any) {
    if (this.selectedTab === 'Каталог') {
      this.catalogData.push(newItem);
      localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    } else if (this.selectedSupply === 'supplies') {
      this.supplyData.push(newItem);
      localStorage.setItem(
        `warehouseSupplies_${this.selectedTab}`,
        JSON.stringify(this.supplyData)
      );
    } else {
      this.stockData.push(newItem);
      localStorage.setItem(
        `warehouseStock_${this.selectedTab}`,
        JSON.stringify(this.stockData)
      );
    }
  }

  handleSettingsClick(item: any) {
    this.selectedItem = item;
  }

  openPopup() {
    this.showPopup = true;
  }

  goToCatalog() {
    this.selectedTab = 'Каталог';
  }

  closeInfoCards() {
    this.selectedItem = null;
  }
}
