import { Injectable, inject, signal } from '@angular/core';
import { CartItem } from '../types/cart.types';
import { Product } from '../types/product.types';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './ws.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private apiUrl = 'http://localhost:3000/cart';

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
    return this.http.post(`${this.apiUrl}/add`, {
      productId: product.id,
      size,
      quantity: 1,
    }, { withCredentials: true }).subscribe({
      error: error => console.error('❌ Ошибка добавления в корзину:', error),
    });
  }

  removeFromCart(item: CartItem) {
    return this.http.post(`${this.apiUrl}/remove`, {
      productId: item.id,
      size: item.size,
      quantity: 1,
    }, { withCredentials: true }).subscribe({
      error: error => console.error('❌ Ошибка удаления из корзины:', error),
    });
  }

  clearCart() {
    return this.http.post(`${this.apiUrl}/clear`, {}, { withCredentials: true })
      .subscribe({
        error: error => console.error('❌ Ошибка очистки корзины:', error),
      });
  }

  loadCart() {
    return this.http.get<CartItem[]>(`${this.apiUrl}`, { withCredentials: true })
      .subscribe({
        next: cart => {
          this.cartItems.set(cart ?? []);
        },
        error: error => console.error('❌ Ошибка загрузки корзины:', error),
      });
  }

}
