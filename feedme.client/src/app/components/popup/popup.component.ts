import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onAddItem = new EventEmitter<any>();
  @Input() warehouse!: string;

  name = '';
  category = '';
  expiryDate = '';
  unitPrice = '';
  totalCost = '';
  stock = '';
  supplyDate = '';
  isSuggestionSelected = false;

  suggestedNames: any[] = [];
  catalogData: any[] = [];
  categories = ['Заготовка', 'Готовое блюдо', 'Добавка', 'Товар'];

  ngOnInit() {
    const savedData = localStorage.getItem(`warehouseCatalog_${this.warehouse}`);
    this.catalogData = savedData ? JSON.parse(savedData) : [];
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

  handleSuggestionSelect(suggestion: any) {
    this.name = suggestion.name;
    this.category = suggestion.category;
    this.stock = suggestion.stock || '';
    this.unitPrice = suggestion.price || '';
    this.expiryDate = suggestion.expiryDate || '';
    this.supplyDate = suggestion.supplyDate || '';
    this.totalCost = suggestion.totalCost || '';
    this.suggestedNames = [];
    this.isSuggestionSelected = true;
  }

  handleSubmit() {
    const id = Date.now().toString();

    const newItem = {
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
    this.stock = '';
    this.unitPrice = '';
    this.expiryDate = '';
    this.supplyDate = '';
    this.totalCost = '';
    this.suggestedNames = [];
  }

  closePopup() {
    this.onClose.emit();
  }
}
