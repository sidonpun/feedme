import { Component } from '@angular/core';

import { WarehousePageComponent } from './warehouse/warehouse-page.component';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    WarehousePageComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private readonly _themeService: ThemeService) {}
}
