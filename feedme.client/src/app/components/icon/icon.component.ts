import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Простой компонент для отображения иконок Bootstrap Icons.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: ` <i [class]="cssClass"></i> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  /** Название иконки без префикса `bi-` */
  @Input() name = '';

  /**
   * Полный CSS класс для элемента `<i>`.
   */
  get cssClass(): string {
    return `bi bi-${this.name}`;
  }
}
