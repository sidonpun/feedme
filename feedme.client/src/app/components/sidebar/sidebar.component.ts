import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Импорт FontAwesome модуля и ядра иконок
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faWarehouse,
  faBoxes,
  faChartBar,
  faTruck,
  faCog,
  faListAlt,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  icons = {
    warehouse: faWarehouse,
    catalog: faBoxes,
    analytics: faChartBar,
    delivery: faTruck,
    orders: faListAlt,
    settings: faCog,
    logout: faSignOutAlt
  };

  constructor(private library: FaIconLibrary) {
    // Обязательно добавь эту строку, чтобы явно зарегистрировать иконки
    library.addIcons(
      faWarehouse,
      faBoxes,
      faChartBar,
      faTruck,
      faListAlt,
      faCog,
      faSignOutAlt
    );
  }
}
