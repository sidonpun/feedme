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


  readonly tabs: ReadonlyArray<SupplyTab> = [
    { key: 'supplies', label: 'Поставки' },
    { key: 'stock', label: 'Остатки' },
    { key: 'catalog', label: 'Каталог' },
    { key: 'inventory', label: 'Инвентаризация' },
  ];

  private readonly actionLabels: Record<SupplySection, { label: string; aria: string }> = {
    supplies: { label: '+ Новая поставка', aria: 'Создать новую поставку' },
    stock: { label: '+ Новая поставка', aria: 'Создать новую поставку' },
    catalog: { label: '+ Новый товар', aria: 'Добавить новый товар в каталог' },
    inventory: { label: '+ Новая поставка', aria: 'Создать новую поставку' },
  };

  onSelect(tab: SupplySection): void {
    if (this.activeTab === tab) {
      return;
    }

    this.activeTabChange.emit(tab);
  }


  trackByTab = (_: number, tab: SupplyTab) => tab.key;
}
