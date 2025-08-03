import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseService } from '../../services/warehouse.service';

@Component({
  selector: 'app-new-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-product.component.html',
  styleUrls: ['./new-product.component.css']
})
export class NewProductComponent implements OnInit {
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  productName = '';
  category = '';
  stock = '';
  unitPrice = '';
  expiryDate = '';
  responsible = '';
  supplier = '';

  /** Данные каталога */
  private catalog: any[] = [];
  /** Подсказки по названию */
  suggestions: any[] = [];
  /** Выбранный товар каталога */
  selectedProduct: any | null = null;

  readonly categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  constructor(private warehouseService: WarehouseService) {}

  ngOnInit(): void {
    this.catalog = this.warehouseService.getCatalog();
  }

  updateSuggestions(): void {
    const query = this.productName.trim().toLowerCase();
    this.selectedProduct = null;
    if (!query) {
      this.suggestions = [];
      return;
    }
    this.suggestions = this.catalog.filter(item =>
      item.name.toLowerCase().includes(query)
    );
  }

  selectSuggestion(item: any): void {
    this.selectedProduct = item;
    this.productName = item.name;
    this.category = item.category;
    this.suggestions = [];
  }

  handleSubmit(): void {
    if (!this.selectedProduct) return;

    const formData = {
      catalogItem: this.selectedProduct,
      productName: this.selectedProduct.name,
      category: this.selectedProduct.category,
      stock: this.stock,
      unitPrice: this.unitPrice,
      expiryDate: this.expiryDate,
      responsible: this.responsible,
      supplier: this.supplier
    };

    this.onSubmit.emit(formData);
    this.resetForm();
  }

  resetForm(): void {
    this.productName = '';
    this.category = '';
    this.stock = '';
    this.unitPrice = '';
    this.expiryDate = '';
    this.responsible = '';
    this.supplier = '';
    this.suggestions = [];
    this.selectedProduct = null;
  }

  cancel(): void {
    this.onCancel.emit();
  }
}
