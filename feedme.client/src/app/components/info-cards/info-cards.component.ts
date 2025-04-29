import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-cards.component.html',
  styleUrls: ['./info-cards.component.css']
})
export class InfoCardsComponent {
  @Input() data: any;
  @Output() onClose = new EventEmitter<void>();

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Заготовка':
        return 'assets/Zagotovka.svg';
      case 'Готовое блюдо':
        return 'assets/Readyfood.svg';
      case 'Добавка':
        return 'assets/Toping.svg';
      case 'Товар':
      default:
        return 'assets/default.svg';
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.onClose.emit();
  }
}
