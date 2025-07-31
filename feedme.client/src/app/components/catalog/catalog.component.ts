import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterPipe } from '../../pipes/filter.pipe';
import { NewProductFormValues } from '../catalog-new-product-popup/catalog-new-product-popup.component';


@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.css']
})
export class CatalogComponent {
  activeTab: 'info' | 'logistics' = 'info';
  filter = '';

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

  /** Добавляет новый товар в каталог */
  addProduct(item: NewProductFormValues): void {
    const newItem = { id: Date.now().toString(), ...item };
    this.catalogData.push(newItem);
  }
}
