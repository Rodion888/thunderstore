import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryComponent {
  private cartService = inject(CartService);

  cartItemsCount = computed(() =>
    this.cartService.cartItems().reduce((total, item) => total + item.quantity, 0)
  );

  cartTotalPrice = computed(() =>
    this.cartService.cartItems().reduce((total, item) => total + item.quantity * item.price, 0)
  );

  getItemText(count: number): string {
    if (count % 10 === 1 && count % 100 !== 11) return 'товар';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'товара';
    return 'товаров';
  }
}
