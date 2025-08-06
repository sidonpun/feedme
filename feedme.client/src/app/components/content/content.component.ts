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
import { CatalogNewProductPopupComponent } from '../catalog-new-product-popup/catalog-new-product-popup.component';

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
    NewProductComponent,
    CatalogNewProductPopupComponent
  ],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {
  /** Вкладка склада (для табов вверху) */
  selectedTab: string = 'Главный склад';

  /** Режим контента: supplies | stock | catalog */
  selectedSupply: 'supplies' | 'stock' | 'catalog' = 'supplies';

  supplyData: any[] = [];
  stockData: any[] = [];
  catalogData: any[] = [];

  selectedItem: any = null;
  showPopup = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  /** Загружаем данные из localStorage */
  private loadAllData(): void {
    this.supplyData = JSON.parse(localStorage.getItem(`warehouseSupplies_${this.selectedTab}`) || '[]');
    this.stockData = JSON.parse(localStorage.getItem(`warehouseStock_${this.selectedTab}`) || '[]');
    this.catalogData = JSON.parse(localStorage.getItem(`warehouseCatalog_${this.selectedTab}`) || '[]');
  }

  /** Смена вкладки склада */
  setSelectedTab(tab: string): void {
    this.selectedTab = tab;
    this.loadAllData();
  }

  /** Переключение modesupply из SupplyControlsComponent */
  onSupplyModeChange(mode: 'supplies' | 'stock' | 'catalog'): void {
    this.selectedSupply = mode;
  }

  /** Открыть попап добавления */
  openNewProductPopup(): void {
    this.showPopup = true;
  }
  closeNewProductPopup(): void {
    this.showPopup = false;
  }

  /** Получить новые данные из формы */
  onNewProductSubmit(item: any): void {
    if (this.selectedSupply === 'supplies') {
      this.supplyData.push(item);
      localStorage.setItem(`warehouseSupplies_${this.selectedTab}`, JSON.stringify(this.supplyData));
    } else if (this.selectedSupply === 'stock') {
      this.stockData.push(item);
      localStorage.setItem(`warehouseStock_${this.selectedTab}`, JSON.stringify(this.stockData));
    } else {
      this.catalogData.push(item);
      localStorage.setItem(`warehouseCatalog_${this.selectedTab}`, JSON.stringify(this.catalogData));
    }
    this.closeNewProductPopup();
  }

  handleSettingsClick(item: any): void {
    this.selectedItem = item;
  }
  closeInfoCards(): void {
    this.selectedItem = null;
  }

  /** Переход в каталог через кнопку из SupplyControlsComponent */
  goToCatalog(): void {
    this.selectedSupply = 'catalog';
  }

  onCatalogRemove(item: any): void {
    this.catalogData = this.catalogData.filter(i => i !== item);
    localStorage.setItem(`warehouseCatalog_${this.selectedTab}`, JSON.stringify(this.catalogData));
  }
}
