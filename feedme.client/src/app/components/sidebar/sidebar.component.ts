import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  readonly icons = {
    warehouse: 'warehouse',
    catalog: 'inventory_2',
    analytics: 'bar_chart',
    delivery: 'local_shipping',
    orders: 'list_alt',
    settings: 'settings',
    logout: 'logout'
  };
}
