import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-history-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-popup.component.html',
  styleUrls: ['./history-popup.component.css']
})
export class HistoryPopupComponent {
  @Input() item: any;
  @Output() onClose = new EventEmitter<void>();

  closePopup() {
    this.onClose.emit();
  }
}
