import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewProductComponent } from '../new-product/new-product.component';
import { CatalogItem } from '../../models/catalog-item.model';
import { normalizeCatalogItem, sanitizeNumericValue } from '../../utils/catalog.utils';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, NewProductComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  showNewProductForm: boolean = false;

  catalogData: CatalogItem[] = [
    {
      id: '0001',
      category: 'Заготовка',
      name: 'Банка Coca-cola',
      stockQuantity: 25,
      stockUnit: 'шт',
      unitPrice: 4.95,
      warehouse: 'Главный склад',
      expiryDate: '2025-12-20',
      supplier: 'ООО Рога и Копыта',
    },
    {
      id: '0002',
      category: 'Готовое блюдо',
      name: 'Курица-гриль',
      stockQuantity: 40,
      stockUnit: 'кг',
      unitPrice: 8.95,
      warehouse: 'Склад на кухне',
      expiryDate: '2025-02-28',
      supplier: 'ООО Рога и Копыта',
    },
  ];

  ngOnInit() {
    const savedCatalog = localStorage.getItem('catalogData');
    if (savedCatalog) {
      const parsedData = JSON.parse(savedCatalog);
      this.catalogData = parsedData.map((item: any) => normalizeCatalogItem(item));
      localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    } else {
      localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    }
  }

  handleAddNewItemClick() {
    this.showNewProductForm = true;
  }

  handleCancelNewProduct() {
    this.showNewProductForm = false;
  }

  handleSubmitNewProduct(formData: any) {
    const stockQuantity = sanitizeNumericValue(formData.stock) ?? 0;
    const unitPrice = sanitizeNumericValue(formData.unitPrice) ?? 0;

    const newItem: CatalogItem = {
      id: Date.now().toString(),
      category: formData.category,
      name: formData.productName,
      stockQuantity,
      stockUnit: 'шт',
      unitPrice,
      warehouse: formData.responsible || 'Главный склад',
      expiryDate: formData.expiryDate,
      supplier: formData.supplier || 'не задан',
    };

    this.catalogData = [...this.catalogData, newItem];
    localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    this.showNewProductForm = false;
  }
}
