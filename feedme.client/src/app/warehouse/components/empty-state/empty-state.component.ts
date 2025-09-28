import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-warehouse-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseEmptyStateComponent {
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) ctaLabel!: string;
  @Input() ctaAriaLabel?: string;

  @Output() readonly cta = new EventEmitter<void>();

  onCtaClick(): void {
    this.cta.emit();
  }

  get resolvedCtaAriaLabel(): string {
    return this.ctaAriaLabel ?? this.ctaLabel;
  }
}
