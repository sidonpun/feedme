import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-empty',
  template: `
    <section class="empty-state" role="status">
      <div class="empty-state__icon">📦</div>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__subtitle">{{ subtitle }}</p>
    </section>
  `,
  styleUrl: './empty-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
}
