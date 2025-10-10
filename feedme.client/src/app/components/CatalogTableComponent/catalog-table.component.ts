import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CatalogItem } from '../../services/catalog.service';

export type CatalogTableView = 'info' | 'logistics';
export type CatalogSortDirection = 'asc' | 'desc';
export interface CatalogSortState {
  readonly column: number;
  readonly direction: CatalogSortDirection;
}

@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-table.component.html',
  styleUrls: ['./catalog-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogTableComponent {
  @Input({ required: true }) data: readonly CatalogItem[] = [];
  @Input({ required: true }) viewMode: CatalogTableView = 'info';
  @Input({ required: true }) sortState: CatalogSortState | null = null;

  @Output() readonly sort = new EventEmitter<number>();
  @Output() readonly sortByKey = new EventEmitter<{ column: number; event: KeyboardEvent }>();

  readonly trackById = (_: number, item: CatalogItem) => item.id;

  onSort(column: number): void {
    this.sort.emit(column);
  }

  onSortKey(column: number, event: KeyboardEvent): void {
    this.sortByKey.emit({ column, event });
  }

  booleanLabel(value: boolean | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return value ? 'Да' : 'Нет';
  }

  isSorted(column: number): boolean {
    return this.sortState?.column === column;
  }

  getSortDirection(column: number): CatalogSortDirection | 'none' {
    if (!this.isSorted(column) || !this.sortState) {
      return 'none';
    }

    return this.sortState.direction;
  }

  getAriaSort(column: number): 'ascending' | 'descending' | 'none' {
    const direction = this.getSortDirection(column);
    if (direction === 'asc') {
      return 'ascending';
    }

    if (direction === 'desc') {
      return 'descending';
    }

    return 'none';
  }

  getFlagLabels(item: CatalogItem): readonly string[] {
    const flags: string[] = [];

    if (item.packagingRequired) {
      flags.push('Требует фасовки');
    }

    if (item.spoilsAfterOpening) {
      flags.push('Портится после вскрытия');
    }

    return flags;
  }
}
