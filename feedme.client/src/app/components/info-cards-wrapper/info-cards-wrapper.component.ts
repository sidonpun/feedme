import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardsComponent } from '../info-cards/info-cards.component';

@Component({
  selector: 'app-info-cards-wrapper',
  standalone: true,
  imports: [CommonModule, InfoCardsComponent],
  templateUrl: './info-cards-wrapper.component.html',

})
export class InfoCardsWrapperComponent {
  @Input() item: any;
  @Output() onClose = new EventEmitter<void>();

  get data() {
    return {
      category: this.item?.category || 'Не указано',
      name: this.item?.name || 'Не указано',
      expense: this.item?.expense || '0',
      expenseKg: this.item?.expenseKg || '0',
      income: this.item?.income || '0',
      incomeKg: this.item?.incomeKg || '0',
      stock: this.item?.stock || '0',
      stockKg: this.item?.stockKg || '0',
      recommendedOrder: this.item?.recommendedOrder || '0',
      recommendedOrderKg: this.item?.recommendedOrderKg || '0',
    };
  }

  handleClose() {
    this.onClose.emit();
  }
}
