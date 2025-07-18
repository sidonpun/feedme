import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component';
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

  ngOnInit() {
    const initialData = localStorage.getItem(`warehouseData_${this.selectedTab}`);
    this.tableData = initialData ? JSON.parse(initialData) : [];
  }

  setSelectedTab(tab: string) {
    this.selectedTab = tab;
    this.loadTableData();
  }

  loadTableData() {
    const data = localStorage.getItem(`warehouseData_${this.selectedTab}`);
    this.tableData = data ? JSON.parse(data) : [];
  }

  handleAddItem(newItem: any) {
    this.tableData.push(newItem);
    localStorage.setItem(
      `warehouseData_${this.selectedTab}`,
      JSON.stringify(this.tableData)
    );
    // Закрываем попап после добавления
    this.showPopup = false;
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

  onAddItem(item: any) {
    this.handleAddItem(item);
    this.showPopup = false;
  }
}
