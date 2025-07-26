import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogNewProductPopupComponent, NewProductFormValues } from '../catalog-new-product-popup/catalog-new-product-popup.component';


@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, CatalogNewProductPopupComponent],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent implements OnInit {
  showNewProductForm = signal(false);

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

  openNewProductPopup(): void {
    this.showNewProductForm.set(true);
  }

  closeNewProductPopup(): void {
    this.showNewProductForm.set(false);
  }

  handleSubmitNewProduct(formData: NewProductFormValues) {
    const newItem = {
      id: Date.now().toString(),
      category: formData.category,
      name: formData.productName,
      unit: formData.unit,
      unitPrice: formData.unitPrice,
      taxRate: formData.taxRate,
      description: formData.description,
      requiresPackaging: formData.requiresPackaging,
      perishableAfterOpening: formData.perishableAfterOpening,
    };
    this.catalogData.push(newItem);
    localStorage.setItem('catalogData', JSON.stringify(this.catalogData));
    this.showNewProductForm.set(false);
  }
}
