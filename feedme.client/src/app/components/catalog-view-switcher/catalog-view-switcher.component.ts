import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalog-view-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-view-switcher.component.html',
  styleUrls: ['./catalog-view-switcher.component.css']
})
export class CatalogViewSwitcherComponent {
  @Input() view: 'info' | 'logistics' = 'info';
  @Output() viewChange = new EventEmitter<'info' | 'logistics'>();

  select(view: 'info' | 'logistics'): void {
    if (this.view !== view) {
      this.view = view;
      this.viewChange.emit(this.view);
    }
  }
}
