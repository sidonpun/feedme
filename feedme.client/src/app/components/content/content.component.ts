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
  // теперь три режима вместо двух
  selectedSupply: 'supplies' | 'stock' | 'catalog' = 'supplies';

  // данные для каждой таблицы
  supplyData: any[] = [];
  stockData: any[] = [];
  catalogData: any[] = [];

  // для InfoCards
  selectedItem: any = null;

  // флаг показа формы добавления
  showPopup = false;

  ngOnInit(): void {
    this.loadAllData();
  }

  /** Загрузить все массивы из localStorage */
  private loadAllData(): void {
    const tabKey = 'Главный склад'; // или любой ваш текущий склад
    this.supplyData = JSON.parse(localStorage.getItem(`warehouseSupplies_${tabKey}`) || '[]');
    this.stockData = JSON.parse(localStorage.getItem(`warehouseStock_${tabKey}`) || '[]');
    this.catalogData = JSON.parse(localStorage.getItem('catalogData') || '[]');
  }

  /** Обработчик события в таблице «Поставки» */
  openNewProductPopup(): void {
    this.showPopup = true;
  }

  closeNewProductPopup(): void {
    this.showPopup = false;
  }

  /** Сабмит из NewProductComponent */
  onNewProductSubmit(item: any): void {
    if (this.selectedSupply === 'supplies') {
      this.supplyData.push(item);
      localStorage.setItem(`warehouseSupplies_Главный склад`, JSON.stringify(this.supplyData));
    } else if (this.selectedSupply === 'stock') {
      this.stockData.push(item);
      localStorage.setItem(`warehouseStock_Главный склад`, JSON.stringify(this.stockData));
    } else { // catalog
      this.catalogData.push(item);
      localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    }
    this.closeNewProductPopup();
  }

  handleSettingsClick(item: any): void {
    this.selectedItem = item;
  }

  closeInfoCards(): void {
    this.selectedItem = null;
  }

  /** Переключение режима из SupplyControlsComponent */
  onSupplyModeChange(mode: 'supplies' | 'stock' | 'catalog'): void {
    this.selectedSupply = mode;
  }

  /** Метод «перейти в каталог» (если используется) */
  goToCatalog(): void {
    this.selectedSupply = 'catalog';
  }
}
