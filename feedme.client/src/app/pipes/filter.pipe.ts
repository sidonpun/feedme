import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true,
})
export class FilterPipe implements PipeTransform {
  transform<T extends Record<string, any>>(items: T[], query: string): T[] {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter(item =>
      Object.values(item).some(val =>
        val && val.toString().toLowerCase().includes(lower)
      )
    );
  }
}
