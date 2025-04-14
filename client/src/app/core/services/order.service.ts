import { Injectable, inject } from '@angular/core';
import { OrderApi } from '../api/order.api';
import { CartService } from './cart.service';
import { OrderData } from '../types/order.types';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orderApi = inject(OrderApi);
  private cartService = inject(CartService);

  createOrder(orderData: OrderData) {
    const cartItems = this.cartService.cartItems();
    const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const orderPayload = {
      ...orderData,
      cartItems,
      totalAmount
    };

    return this.orderApi.createOrder(orderPayload);
  }
}
