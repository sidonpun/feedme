import { Component } from '@angular/core';

import { WarehousePageComponent } from './warehouse/warehouse-page.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    WarehousePageComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {}
