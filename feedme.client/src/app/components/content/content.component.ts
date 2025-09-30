import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';
import { SupplyControlsComponent } from '../supply-controls/supply-controls.component';
import { InfoCardsWrapperComponent } from '../info-cards-wrapper/info-cards-wrapper.component';
import { CatalogComponent } from '../catalog/catalog.component';
import { WarehouseTableComponent } from '../warehouse-table/warehouse-table.component';
import { PopupComponent } from '../popup/popup.component';
import { SupplyItem } from '../../models/supply-item.model';
import { SupplyView, WarehouseSuppliesService } from '../../services/warehouse-supplies.service';

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
  selectedWarehouse: string = 'Главный склад';
  selectedSupply: SupplyView = 'supplies';
  tableData: SupplyItem[] = [];
  selectedItem: SupplyItem | null = null;
  showPopup: boolean = false;

  constructor(private readonly warehouseSuppliesService: WarehouseSuppliesService) {}

  ngOnInit() {
    this.loadTableData();
  }

  setSelectedWarehouse(warehouse: string) {
    this.selectedWarehouse = warehouse;
    this.loadTableData();
  }

  onSupplyChange(view: SupplyView) {
    this.selectedSupply = view;
    if (view !== 'catalog') {
      this.loadTableData();
    }
  }

  private loadTableData() {
    this.tableData = this.warehouseSuppliesService.loadSupplies(this.selectedWarehouse);
  }

  handleSettingsClick(item: SupplyItem) {
    this.selectedItem = item;
  }

  openPopup() {
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  goToCatalog() {
    this.onSupplyChange('catalog');
  }

  closeInfoCards() {
    this.selectedItem = null;
  }

  onAddItem(item: SupplyItem) {
    this.tableData = this.warehouseSuppliesService.addSupply(this.selectedWarehouse, item);
    this.closePopup();
  }
}
