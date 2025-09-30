import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-warehouse-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warehouse-tabs.component.html',
  styleUrls: ['./warehouse-tabs.component.css']
})
export class WarehouseTabsComponent implements OnInit {
  warehouses: string[] = [];
  showNewWarehousePopup = false;
  newWarehouseName = '';

  @Input() selectedWarehouse: string = 'Главный склад';
  @Output() selectedWarehouseChange = new EventEmitter<string>();

  ngOnInit() {
    const savedWarehouses = localStorage.getItem('warehouses');
    this.warehouses = savedWarehouses ? JSON.parse(savedWarehouses) : ['Главный склад'];
  }

  selectTab(tab: string) {
    this.selectedWarehouse = tab;
    this.selectedWarehouseChange.emit(this.selectedWarehouse);
  }

  handleAddWarehouse() {
    const trimmedName = this.newWarehouseName.trim();
    if (!trimmedName) {
      alert('Введите корректное название склада');
      return;
    }

    if (this.warehouses.includes(trimmedName)) {
      alert('Такой склад уже существует');
      return;
    }

    this.warehouses.push(trimmedName);
    localStorage.setItem('warehouses', JSON.stringify(this.warehouses));
    localStorage.setItem(`warehouseData_${trimmedName}`, JSON.stringify([]));

    this.newWarehouseName = '';
    this.showNewWarehousePopup = false;
  }

  handleRemoveWarehouse(name: string, event: MouseEvent) {
    event.stopPropagation();

    if (name === 'Главный склад') {
      alert('Главный склад нельзя удалить!');
      return;
    }

    if (confirm(`Удалить склад "${name}"?`)) {
      this.warehouses = this.warehouses.filter(w => w !== name);
      localStorage.setItem('warehouses', JSON.stringify(this.warehouses));
      localStorage.removeItem(`warehouseData_${name}`);

      if (this.selectedWarehouse === name) {
        this.selectTab('Главный склад');
      }
    }
  }
}
