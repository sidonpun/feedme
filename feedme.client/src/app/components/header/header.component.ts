import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type TabName = 'Поставки' | 'Остатки' | 'Каталог' | 'Инвентаризация';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly tabs: readonly TabName[] = ['Поставки', 'Остатки', 'Каталог', 'Инвентаризация'];
  readonly activeTab = signal<TabName>(this.tabs[0]);

  setActiveTab(tab: TabName): void {
    this.activeTab.set(tab);
  }
}
