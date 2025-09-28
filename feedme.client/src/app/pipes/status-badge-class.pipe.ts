import { Pipe, PipeTransform } from '@angular/core';

const STATUS_CLASS_MAP = new Map<string, string>([
  ['ок', 'badge--ok'],
  ['ok', 'badge--ok'],
  ['норма', 'badge--ok'],
  ['normal', 'badge--ok'],
  ['в наличии', 'badge--ok'],
  ['черновик', 'badge--draft'],
  ['draft', 'badge--draft'],
  ['скоро срок', 'badge--warn'],
  ['warning', 'badge--warn'],
  ['warn', 'badge--warn'],
  ['due soon', 'badge--warn'],
  ['soon', 'badge--warn'],
  ['просрочено', 'badge--danger'],
  ['danger', 'badge--danger'],
  ['expired', 'badge--danger'],
  ['overdue', 'badge--danger'],
  ['в пути', 'badge--transit'],
  ['в дороге', 'badge--transit'],
  ['transit', 'badge--transit'],
  ['on the way', 'badge--transit'],
  ['in transit', 'badge--transit'],
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
