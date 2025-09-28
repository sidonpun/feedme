import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-empty',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() ctaText?: string;
}
