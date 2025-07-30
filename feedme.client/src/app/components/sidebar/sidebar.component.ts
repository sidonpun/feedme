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
    catalog: 'category',
    analytics: 'analytics',
    delivery: 'local_shipping',
    orders: 'assignment',
    settings: 'settings',
    logout: 'logout'
  };
}
