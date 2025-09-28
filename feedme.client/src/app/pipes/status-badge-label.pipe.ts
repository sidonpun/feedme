import { Pipe, PipeTransform } from '@angular/core';

const STATUS_LABEL_MAP = new Map<string, string>([
  ['ок', 'Ок'],
  ['ok', 'Ок'],
  ['норма', 'Ок'],
  ['normal', 'Ок'],
  ['в наличии', 'Ок'],
  ['скоро срок', 'Скоро срок'],
  ['warning', 'Скоро срок'],
  ['warn', 'Скоро срок'],
  ['due soon', 'Скоро срок'],
  ['soon', 'Скоро срок'],
  ['просрочено', 'Просрочено'],
  ['danger', 'Просрочено'],
  ['expired', 'Просрочено'],
  ['overdue', 'Просрочено'],
  ['черновик', 'Черновик'],
  ['draft', 'Черновик'],
  ['drafts', 'Черновик'],
  ['черновики', 'Черновик'],
  ['в пути', 'В пути'],
  ['в дороге', 'В пути'],
  ['transit', 'В пути'],
  ['on the way', 'В пути'],
  ['in transit', 'В пути'],
]);

const DEFAULT_LABEL = 'Ок';

@Pipe({
  name: 'statusBadgeLabel',
  standalone: true,
})
export class StatusBadgeLabelPipe implements PipeTransform {
  transform(status?: string | null): string {
    const normalized = (status ?? '').trim().toLowerCase();
    return STATUS_LABEL_MAP.get(normalized) ?? DEFAULT_LABEL;
  }
}
