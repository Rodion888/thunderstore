import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/types/cart.types';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackgroundVideoComponent } from '../../shared/components/background-video/background-video.component';
import { BackgroundService } from '../../core/services/background.service';
import { SummaryComponent } from '../../shared/components/summary/summary.component';
import { AppCurrencyPipe } from '../../shared/pipes/currency.pipe';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  imports: [CommonModule, ButtonComponent, BackgroundVideoComponent, SummaryComponent, AppCurrencyPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  private cartService = inject(CartService);
  private router = inject(Router);
  private backgroundService = inject(BackgroundService);

  cartItems = computed(() => this.groupCartItems(this.cartService.cartItems()));

  constructor() {
    this.backgroundService.setVideo('assets/videos/bg.mp4');
  }

  cartTotal() {
    return this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  goToCheckout() {
    this.cartService.cartItems().length && this.router.navigate(['/checkout']);
  }

  removeFromCart(item: CartItem) {
    this.cartService.removeFromCart(item);
  }

  clearCart() {
    this.cartService.cartItems().length && this.cartService.clearCart();
  }

  private groupCartItems(items: CartItem[]): CartItem[] {
    const groupedItems: Record<string, CartItem> = {};

    items.forEach(item => {
      const key = `${item.id}-${item.size}`;

      if (groupedItems[key]) {
        groupedItems[key].quantity += item.quantity;
      } else {
        groupedItems[key] = { ...item };
      }
    });

    return Object.values(groupedItems);
  }
}

export default CartComponent;
