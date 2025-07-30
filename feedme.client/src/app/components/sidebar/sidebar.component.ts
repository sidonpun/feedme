import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  /**
   * Сопоставление пунктов меню и названий иконок.
   */
  icons = {
    warehouse: 'building',
    catalog: 'boxes',
    analytics: 'bar-chart',
    delivery: 'truck',
    orders: 'card-list',
    settings: 'gear',
    logout: 'box-arrow-right',
  };
}
