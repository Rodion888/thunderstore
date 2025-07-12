import { Injectable, inject, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItem } from '../types/cart.types';
import { Product } from '../types/product.types';
import { WebSocketService } from './ws.service';
import { CartApi } from '../api/cart.api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartApi = inject(CartApi);
  private wsService = inject(WebSocketService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  cartItems = signal<CartItem[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCart();
      this.handleWsUpdate();
    }
  }

  private handleWsUpdate() {
    this.wsService.events$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      this.cartItems.set(data.cart);
    });
  }

  addToCart(product: Product, size: string) {
    return this.cartApi.addToCart(product.id, size).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      error: error => console.error(error),
    });
  }

  removeFromCart(item: CartItem) {
    return this.cartApi.removeFromCart(item.id, item.size).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      error: error => console.error(error),
    });
  }

  clearCart() {
    return this.cartApi.clearCart().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      error: error => console.error(error),
    });
  }

  loadCart() {
    return this.cartApi.getCart().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (cartItems) => {
        this.cartItems.set(cartItems);
      },
      error: error => console.error(error),
    });
  }

  getTotalItemsCount(): number {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  }

  calculateTotal(): number {
    return this.cartItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}
