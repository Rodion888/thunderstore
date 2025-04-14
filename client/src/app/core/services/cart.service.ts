import { Injectable, inject, signal } from '@angular/core';
import { CartItem } from '../types/cart.types';
import { Product } from '../types/product.types';
import { WebSocketService } from './ws.service';
import { CartApi } from '../api/cart.api';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartApi = inject(CartApi);
  private wsService = inject(WebSocketService);

  cartItems = signal<CartItem[]>([]);

  constructor() {
    this.loadCart();
    this.handleWsUpdate();
  }

  private handleWsUpdate() {
    this.wsService.events$.subscribe(data => {
      this.cartItems.set(data.cart);
    });
  }

  addToCart(product: Product, size: string) {
    return this.cartApi.addToCart(product.id, size).subscribe({
      error: error => console.error(error),
    });
  }

  removeFromCart(item: CartItem) {
    return this.cartApi.removeFromCart(item.id, item.size).subscribe({
      error: error => console.error(error),
    });
  }

  clearCart() {
    return this.cartApi.clearCart().subscribe({
      error: error => console.error(error),
    });
  }

  loadCart() {
    return this.cartApi.getCart().subscribe({
      next: cart => {
        this.cartItems.set(cart ?? []);
      },
      error: error => console.error(error),
    });
  }

  getTotalItemsCount(): number {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  }

  calculateTotal(): number {
    return this.cartItems().reduce((total, item) => total + item.price * item.quantity, 0);
  }
}
