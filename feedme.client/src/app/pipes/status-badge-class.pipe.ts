import { Pipe, PipeTransform } from '@angular/core';

const STATUS_CLASS_MAP = new Map<string, string>([
  ['ок', 'badge--ok'],
  ['ok', 'badge--ok'],
  ['норма', 'badge--ok'],
  ['normal', 'badge--ok'],
  ['в наличии', 'badge--ok'],
  ['скоро срок', 'badge--warn'],
  ['warning', 'badge--warn'],
  ['warn', 'badge--warn'],
  ['due soon', 'badge--warn'],
  ['soon', 'badge--warn'],
  ['просрочено', 'badge--danger'],
  ['danger', 'badge--danger'],
  ['expired', 'badge--danger'],
  ['overdue', 'badge--danger'],
]);

const DEFAULT_BADGE_CLASS = 'badge--ok';

@Pipe({
  name: 'statusBadgeClass',
  standalone: true,
})
export class StatusBadgeClassPipe implements PipeTransform {
  transform(status?: string | null): string {
    const normalized = (status ?? '').trim().toLowerCase();
    return STATUS_CLASS_MAP.get(normalized) ?? DEFAULT_BADGE_CLASS;
  }
}
