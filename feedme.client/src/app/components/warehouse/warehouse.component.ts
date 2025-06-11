import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.css']
})
export class WarehouseComponent implements OnInit {
  warehouses: string[] = [];
  selectedWarehouse: string = '';
  newWarehouseName: string = '';

  ngOnInit() {
    const savedWarehouses = localStorage.getItem('warehouses');
    this.warehouses = savedWarehouses ? JSON.parse(savedWarehouses) : ['Главный склад'];
    this.selectedWarehouse = this.warehouses[0];
  }

  addWarehouse() {
    const trimmedName = this.newWarehouseName.trim();
    if (!trimmedName) {
      alert('Название склада не может быть пустым.');
      return;
    }
    if (this.warehouses.includes(trimmedName)) {
      alert('Склад с таким названием уже существует!');
      return;
    }

    this.warehouses.push(trimmedName);
    localStorage.setItem('warehouses', JSON.stringify(this.warehouses));
    localStorage.setItem(`warehouseData_${trimmedName}`, JSON.stringify([]));
    this.selectedWarehouse = trimmedName;
    this.newWarehouseName = '';
  }

  removeWarehouse(name: string) {
    if (name === 'Главный склад') {
      alert('Главный склад нельзя удалить!');
      return;
    }
    if (confirm(`Вы точно хотите удалить склад "${name}"?`)) {
      this.warehouses = this.warehouses.filter(w => w !== name);
      localStorage.setItem('warehouses', JSON.stringify(this.warehouses));
      localStorage.removeItem(`warehouseData_${name}`);
      this.selectedWarehouse = 'Главный склад';
    }
  }

  selectWarehouse(name: string) {
    this.selectedWarehouse = name;
  }
}
