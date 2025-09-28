import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-metric',
  template: `
    <article class="metric" [class.metric--warn]="variant === 'warn'" [class.metric--danger]="variant === 'danger'">
      <header class="metric__title">{{ title }}</header>
      <div class="metric__value">{{ value }}</div>
      <p class="metric__hint">{{ hint }}</p>
    </article>
  `,
  styleUrl: './metric.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) hint!: string;
  @Input() variant: 'default' | 'warn' | 'danger' = 'default';
}
