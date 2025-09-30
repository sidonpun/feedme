import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogItem } from '../../models/catalog-item.model';
import { SupplyItem } from '../../models/supply-item.model';
import { normalizeCatalogItem, sanitizeNumericValue } from '../../utils/catalog.utils';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onAddItem = new EventEmitter<SupplyItem>();

  name = '';
  category = '';
  expiryDate = '';
  unitPrice: number | null = null;
  totalCost: number | null = null;
  stock: number | null = null;
  supplyDate = '';
  isSuggestionSelected = false;

  suggestedNames: CatalogItem[] = [];
  catalogData: CatalogItem[] = [];
  categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  ngOnInit() {
    const savedData = localStorage.getItem('catalogData');
    this.catalogData = savedData
      ? JSON.parse(savedData).map((item: any) => normalizeCatalogItem(item))
      : [];
  }

  updateSuggestions() {
    if (this.name.length > 0) {
      this.suggestedNames = this.catalogData.filter(item =>
        item.name.toLowerCase().includes(this.name.toLowerCase())
      );
      this.isSuggestionSelected = false;
    } else {
      this.suggestedNames = [];
    }
  }

  handleSuggestionSelect(suggestion: CatalogItem) {
    this.name = suggestion.name;
    this.category = suggestion.category;
    const sanitizedStock = sanitizeNumericValue(suggestion.stockQuantity);
    const sanitizedUnitPrice = sanitizeNumericValue(suggestion.unitPrice);

    this.stock = sanitizedStock ?? suggestion.stockQuantity ?? null;
    this.unitPrice = sanitizedUnitPrice ?? suggestion.unitPrice ?? null;
    this.expiryDate = suggestion.expiryDate || '';
    this.supplyDate = (suggestion as any).supplyDate || '';

    const normalizedTotalCost = sanitizeNumericValue(
      suggestion.totalCost ?? (suggestion as any).totalCost
    );

    if (normalizedTotalCost !== null) {
      this.totalCost = normalizedTotalCost;
    } else if (this.stock !== null && this.unitPrice !== null) {
      this.totalCost = Number((this.stock * this.unitPrice).toFixed(2));
    } else {
      this.totalCost = null;
    }

    this.suggestedNames = [];
    this.isSuggestionSelected = true;
  }

  handleSubmit() {
    if (this.stock === null || this.unitPrice === null || this.totalCost === null) {
      return;
    }

    const id = Date.now().toString();

    const newItem: SupplyItem = {
      id,
      name: this.name,
      category: this.category,
      stock: this.stock,
      unitPrice: this.unitPrice,
      expiryDate: this.expiryDate,
      supplyDate: this.supplyDate,
      totalCost: this.totalCost
    };

    this.onAddItem.emit(newItem);
    this.resetForm();
  }

  resetForm() {
    this.name = '';
    this.category = '';
    this.stock = null;
    this.unitPrice = null;
    this.expiryDate = '';
    this.supplyDate = '';
    this.totalCost = null;
    this.suggestedNames = [];
    this.isSuggestionSelected = false;
  }

  closePopup() {
    this.onClose.emit();
  }
}
