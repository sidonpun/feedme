import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';      // путь исправлен :contentReference[oaicite:1]{index=1}
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component'; // путь исправлен :contentReference[oaicite:2]{index=2}
import { InfoCardsWrapperComponent } from '../info-cards-wrapper/info-cards-wrapper.component';
import { CatalogComponent } from '../catalog/catalog.component';
import { WarehouseTableComponent } from '../warehouse-table/warehouse-table.component';
import { PopupComponent } from '../popup/popup.component';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WarehouseTabsComponent,
    SupplyControlsComponent,
    InfoCardsWrapperComponent,
    CatalogComponent,
    WarehouseTableComponent,
    PopupComponent
  ],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {
  selectedTab: string = 'Главный склад';
  selectedSupply: string = 'supplies';
  tableData: any[] = [];
  selectedItem: any = null;
  showPopup: boolean = false;

  ngOnInit(): void {
    this.loadTableData();
  }

  /** Переключение вкладки и перезагрузка данных */
  setSelectedTab(tab: string): void {
    this.selectedTab = tab;
    this.loadTableData();
  }

  /** Загрузка из localStorage для текущей вкладки */
  private loadTableData(): void {
    const data = localStorage.getItem(`warehouseData_${this.selectedTab}`);
    this.tableData = data ? JSON.parse(data) : [];
  }

  /** Добавление нового товара из попапа и закрытие попапа */
  handleAddItem(newItem: any): void {
    this.tableData.push(newItem);
    localStorage.setItem(
      `warehouseData_${this.selectedTab}`,
      JSON.stringify(this.tableData)
    );
    this.closePopup(); // закрываем сразу после добавления
  }

  /** Открытие попапа */
  openPopup(): void {
    this.showPopup = true;
  }

  /** Закрытие попапа */
  closePopup(): void {
    this.showPopup = false;
  }

  /** Открыть карточки информации */
  handleSettingsClick(item: any): void {
    this.selectedItem = item;
  }

  /** Закрыть карточки информации */
  closeInfoCards(): void {
    this.selectedItem = null;
  }

  /** Переход в каталог */
  goToCatalog(): void {
    this.selectedTab = 'Каталог';
  }
}
