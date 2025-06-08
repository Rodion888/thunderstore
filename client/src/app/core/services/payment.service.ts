import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Router } from '@angular/router';

export interface PaymentRequest {
  orderId: number;
  amount: number;
  email: string;
}

export interface PaymentResponse {
  paymentUrl: string;
}

export interface PaymentStatus {
  orderId: number | string;
  paid: boolean;
  date?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private router = inject(Router);
  private apiUrl = `${this.config.apiUrl}/payment`;
  
  private paymentStatusSignal = signal<PaymentStatus | null>(null);
  
  readonly paymentStatus = this.paymentStatusSignal.asReadonly();

  createCryptoPayment(paymentRequest: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/create`, paymentRequest, {
      withCredentials: true
    });
  }

  handleSuccessfulPayment(orderId: number | string): void {
    this.paymentStatusSignal.set({
      orderId,
      paid: true,
      date: new Date()
    });
    
    this.router.navigate(['/success'], { 
      queryParams: { orderId } 
    });
  }

  checkPaymentStatus(orderId: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${orderId}`, {
      withCredentials: true
    });
  }
  
  clearPaymentStatus(): void {
    this.paymentStatusSignal.set(null);
  }
  
  updatePaymentStatus(status: PaymentStatus): void {
    this.paymentStatusSignal.set(status);
  }
} 