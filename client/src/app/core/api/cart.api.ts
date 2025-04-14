import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CartItem } from '../types/cart.types';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class CartApi {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private apiUrl = `${this.config.apiUrl}/cart`;

  getCart() {
    return this.http.get<CartItem[]>(this.apiUrl, { withCredentials: true });
  }

  addToCart(productId: number, size: string) {
    return this.http.post(`${this.apiUrl}/add`, {
      productId,
      size,
      quantity: 1,
    }, { withCredentials: true });
  }

  removeFromCart(productId: number, size: string) {
    return this.http.post(`${this.apiUrl}/remove`, {
      productId,
      size,
      quantity: 1,
    }, { withCredentials: true });
  }

  clearCart() {
    return this.http.post(`${this.apiUrl}/clear`, {}, { withCredentials: true });
  }
} 