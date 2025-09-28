import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-field',
  template: `
    <div class="field">
      <span class="field__label">{{ label }}</span>
      <span class="field__value">{{ value }}</span>
    </div>
  `,
  styleUrl: './field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
}
