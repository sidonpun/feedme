import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HelloComponent } from '../hello-component/hello.component';
import {
  faWarehouse,
  faList,
  faChartColumn,
  faTruck,
  faClipboardList,
  faCog,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, HelloComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  readonly icons = {
    warehouse: faWarehouse,
    catalog: faList,
    analytics: faChartColumn,
    delivery: faTruck,
    orders: faClipboardList,
    settings: faCog,
    logout: faSignOutAlt
  };

  constructor(private faLibrary: FaIconLibrary) {
    faLibrary.addIcons(
      faWarehouse,
      faList,
      faChartColumn,
      faTruck,
      faClipboardList,
      faCog,
      faSignOutAlt
    );
  }
}
