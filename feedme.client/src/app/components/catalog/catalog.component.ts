import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewProductComponent } from '../new-product/new-product.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, NewProductComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  showNewProductForm: boolean = false;

  catalogData: any[] = [
    {
      id: '0001',
      category: 'Заготовка',
      name: 'Банка Coca-cola',
      stock: '25шт',
      price: '$4.95',
      warehouse: 'Главный склад',
      expiryDate: '20/12/2025',
      supplier: 'ООО Рога и Копыта',
    },
    {
      id: '0002',
      category: 'Готовое блюдо',
      name: 'Курица-гриль',
      stock: '40кг',
      price: '$8.95',
      warehouse: 'Склад на кухне',
      expiryDate: '28/02/2025',
      supplier: 'ООО Рога и Копыта',
    },
  ];

  ngOnInit() {
    const savedCatalog = localStorage.getItem('catalogData');
    this.catalogData = savedCatalog ? JSON.parse(savedCatalog) : this.catalogData;
  }

  handleAddNewItemClick() {
    this.showNewProductForm = true;
  }

  handleCancelNewProduct() {
    this.showNewProductForm = false;
  }

  handleSubmitNewProduct(formData: any) {
    const newItem = {
      id: Date.now().toString(),
      category: formData.category,
      name: formData.productName,
      stock: formData.stock,
      price: formData.unitPrice,
      warehouse: formData.responsible || 'Главный склад',
      expiryDate: formData.expiryDate,
      supplier: formData.supplier || 'не задан',
    };
    this.catalogData.push(newItem);
    localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    this.showNewProductForm = false;
  }
}
