import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

type SupplySection = 'supplies' | 'stock' | 'catalog' | 'inventory';

type SupplyTab = {
  readonly key: SupplySection;
  readonly label: string;
};

@Component({
  selector: 'app-supply-controls',
  standalone: true,
  imports: [NgFor],
  templateUrl: './supply-controls.component.html',
  styleUrls: ['./supply-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplyControlsComponent {
  @Input() activeTab: SupplySection = 'supplies';
  @Output() activeTabChange = new EventEmitter<SupplySection>();
  @Output() createSupply = new EventEmitter<void>();

  readonly tabs: ReadonlyArray<SupplyTab> = [
    { key: 'supplies', label: 'Поставки' },
    { key: 'stock', label: 'Остатки' },
    { key: 'catalog', label: 'Каталог' },
    { key: 'inventory', label: 'Инвентаризация' },
  ];

  onSelect(tab: SupplySection): void {
    if (this.activeTab === tab) {
      return;
    }

    this.activeTabChange.emit(tab);
  }

  onCreateSupply(): void {
    this.createSupply.emit();
  }

  trackByTab = (_: number, tab: SupplyTab) => tab.key;
}
