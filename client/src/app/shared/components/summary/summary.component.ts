import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../pipes/currency.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  imports: [CommonModule, AppCurrencyPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  private cartService = inject(CartService);
  private translationService = inject(TranslationService);

  cartItemsCount = computed(() => this.cartService.getTotalItemsCount());

  cartTotalPrice = computed(() => this.cartService.calculateTotal());

  getItemText(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return this.translationService.translate('item-one');
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return this.translationService.translate('item-few');
    return this.translationService.translate('item-many');
  }
}
