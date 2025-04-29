import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  restaurantName: string = 'Rest. Name';
  status: string = 'Ресторан активен';
  userName: string = 'Sandy Prossako';
  avatarUrl: string = 'assets/default.svg';
  arrowDownUrl: string = 'assets/default.svg';

  // Исправляем ошибку: добавляем отсутствующий getter formattedDate
  get formattedDate(): string {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('ru-RU', options);
  }
}
