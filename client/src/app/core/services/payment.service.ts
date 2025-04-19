import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface PaymentRequest {
  orderId: number;
  amount: number;
  email: string;
}

export interface PaymentResponse {
  paymentUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private apiUrl = `${this.config.apiUrl}/payment`;

  createCryptoPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/create`, paymentRequest, {
      withCredentials: true
    });
  }
} 