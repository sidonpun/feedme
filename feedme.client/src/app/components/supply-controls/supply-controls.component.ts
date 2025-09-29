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
  @Output() primaryAction = new EventEmitter<void>();

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

  onPrimaryAction(): void {
    this.primaryAction.emit();
  }

  get primaryActionLabel(): string {
    return this.actionLabels[this.activeTab]?.label ?? this.actionLabels.supplies.label;
  }

  get primaryActionAriaLabel(): string {
    return this.actionLabels[this.activeTab]?.aria ?? this.actionLabels.supplies.aria;
  }

  trackByTab = (_: number, tab: SupplyTab) => tab.key;
}
