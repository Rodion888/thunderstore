import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConfigService } from '../services/config.service';
import { OrderPayload, OrderResponse } from '../types/order.types';

@Injectable({
  providedIn: 'root'
})
export class OrderApi {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private apiUrl = `${this.config.apiUrl}/api/orders`;

  createOrder(orderPayload: OrderPayload) {
    return this.http.post<OrderResponse>(this.apiUrl, orderPayload, { withCredentials: true });
  }
}
