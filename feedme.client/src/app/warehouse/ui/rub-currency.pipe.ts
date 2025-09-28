import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rubCurrency',
  standalone: true,
})
export class RubCurrencyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  });

  transform(value: number | null | undefined): string {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    return this.formatter.format(Number.isFinite(numeric) ? numeric : 0);
  }
}
