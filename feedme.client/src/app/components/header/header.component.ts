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
  formattedDate: string = this.formatDate(new Date());
  userName: string = 'Sandy Prossako';
  avatarUrl: string = 'assets/default.svg';
  arrowDownUrl: string = 'assets/default.svg';

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
