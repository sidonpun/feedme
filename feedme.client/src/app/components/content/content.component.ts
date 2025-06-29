import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component';
import { InfoCardsWrapperComponent } from '../info-cards-wrapper/info-cards-wrapper.component';

import { SupplyTableComponent } from '../SupplyTableComponent/supply-table.component';
import { StockTableComponent } from '../StockTableComponent/stock-table.component';
import { CatalogTableComponent } from '../CatalogTableComponent/catalog-table.component';

import { NewProductComponent } from '../new-product/new-product.component';

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
    NewProductComponent
  ],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {
  // табы склада/каталога
  selectedTab: string = 'Главный склад';
  selectedSupply: 'supplies' | 'stock' = 'supplies';

  // данные для трёх таблиц
  supplyData: any[] = [];
  stockData: any[] = [];
  catalogData: any[] = [];

  // для InfoCards
  selectedItem: any = null;

  // показывать форму добавления товара?
  showNewProductPopup = false;

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

  // открыть/закрыть попап добавления
  openNewProductPopup() {
    this.showNewProductPopup = true;
  }
  closeNewProductPopup() {
    this.showNewProductPopup = false;
  }

  // общий метод добавления — используется и для NewProductComponent
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

  // при сабмите формы NewProductComponent
  onNewProductSubmit(formData: any) {
    this.handleAddItem(formData);
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
