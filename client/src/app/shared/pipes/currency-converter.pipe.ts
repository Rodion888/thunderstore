import { inject, Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'currencyConverter',
  pure: false
})
export class CurrencyConverterPipe implements PipeTransform {
  private currencyService = inject(CurrencyService);

  transform(value: number): string {
    return this.currencyService.formatPrice(value);
  }
} 