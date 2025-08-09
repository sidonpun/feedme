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
  stock = '';
  expiryDate = '';
  isSuggestionSelected = false;

  suggestedNames: any[] = [];
  catalogData: any[] = [];

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
    this.suggestedNames = [];
    this.isSuggestionSelected = true;
  }

  handleSubmit() {
    if (!this.isSuggestionSelected) {
      return;
    }

    const id = Date.now().toString();

    const newItem = {
      id,
      name: this.name,
      stock: this.stock,
      expiryDate: this.expiryDate,
    };

    this.onAddItem.emit(newItem);
    this.resetForm();
  }

  resetForm() {
    this.name = '';
    this.stock = '';
    this.expiryDate = '';
    this.suggestedNames = [];
    this.isSuggestionSelected = false;
  }

  closePopup() {
    this.onClose.emit();
  }
}
