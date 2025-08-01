import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-delete-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-delete-popup.component.html',
  styleUrls: ['./confirm-delete-popup.component.css']
})
export class ConfirmDeletePopupComponent {
  @Input() title = 'Удаление';
  @Input() message = 'Вы уверены, что хотите удалить запись?';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
