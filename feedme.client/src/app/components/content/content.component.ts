import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component';
import { InfoCardsWrapperComponent } from '../info-cards-wrapper/info-cards-wrapper.component';
import { SupplyTableComponent } from '../SupplyTableComponent/supply-table.component';
import { StockTableComponent } from '../StockTableComponent/stock-table.component';
import { CatalogTableComponent } from '../CatalogTableComponent/catalog-table.component';
import { NewProductComponent } from '../new-product/new-product.component';
import { CatalogNewProductPopupComponent } from '../catalog-new-product-popup/catalog-new-product-popup.component';
import { CatalogService, CatalogItem } from '../../services/catalog.service';

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
  catalogData: CatalogItem[] = [];

  selectedItem: any = null;
  showPopup = false;

  constructor(private catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  /** Загружаем данные из localStorage и сервера */
  private loadAllData(): void {
    this.supplyData = JSON.parse(localStorage.getItem(`warehouseSupplies_${this.selectedTab}`) || '[]');
    this.stockData = JSON.parse(localStorage.getItem(`warehouseStock_${this.selectedTab}`) || '[]');
    this.catalogService.getAll().subscribe(data => {
      this.catalogData = data;
    });
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
      this.closeNewProductPopup();
    } else if (this.selectedSupply === 'stock') {
      this.stockData.push(item);
      localStorage.setItem(`warehouseStock_${this.selectedTab}`, JSON.stringify(this.stockData));
      this.closeNewProductPopup();
    } else {
      this.catalogService
        .create(item)
        .pipe(take(1))
        .subscribe({
          next: created => {
            this.catalogData = [...this.catalogData, created];
            this.closeNewProductPopup();
          },
          error: err => console.error('Ошибка при добавлении товара в каталог', err)
        });
    }
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

  onCatalogRemove(item: CatalogItem): void {
    this.catalogData = this.catalogData.filter(i => i !== item);
  }
}
