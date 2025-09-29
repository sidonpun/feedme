import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { WarehouseTabsComponent } from '../warehouse-tabs/warehouse-tabs.component';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, WarehouseTabsComponent],
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentComponent {
  private readonly activeWarehouse = signal('Главный склад');

  selectedWarehouse = this.activeWarehouse.asReadonly();

  selectWarehouse(name: string): void {
    this.activeWarehouse.set(name);
  }
}
