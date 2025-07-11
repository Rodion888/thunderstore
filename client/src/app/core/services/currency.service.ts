import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

export type Currency = 'RUB' | 'USD';

interface StoredExchangeRate {
  rate: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private fallbackExchangeRate = 90;
  
  public exchangeRate = signal<number>(this.fallbackExchangeRate);
  public currency = signal<Currency>('RUB');
  
  private readonly STORAGE_KEY = 'exchange_rate_data';
  private readonly CURRENCY_STORAGE_KEY = 'currency';
  private readonly RATE_EXPIRY_TIME = 86400000;
  private readonly API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
  
  constructor() {
    this.initCurrency();
    this.initExchangeRate();
  }

  private initCurrency(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedCurrency = localStorage.getItem(this.CURRENCY_STORAGE_KEY) as Currency;
      this.currency.set(savedCurrency || 'RUB');
    } else {
      this.currency.set('RUB');
    }
  }

  private initExchangeRate(): void {
    const storedData = this.getStoredExchangeRate();
    
    if (storedData && !this.isRateExpired(storedData.timestamp)) {
      this.exchangeRate.set(storedData.rate);
    } else {
      this.fetchExchangeRate();
    }
  }
  
  private isRateExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.RATE_EXPIRY_TIME;
  }
  
  private getStoredExchangeRate(): StoredExchangeRate | null {
    if (isPlatformBrowser(this.platformId)) {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    }
    return null;
  }
  
  private storeExchangeRate(rate: number): void {
    if (isPlatformBrowser(this.platformId)) {
      const data: StoredExchangeRate = {
        rate,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  fetchExchangeRate(): void {
    this.http.get<any>(this.API_URL).pipe(
      tap(response => {
        if (response?.usd?.rub) {
          const rate = response.usd.rub;
          this.exchangeRate.set(rate);
          this.storeExchangeRate(rate);
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  setCurrency(currency: Currency): void {
    this.currency.set(currency);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CURRENCY_STORAGE_KEY, currency);
    }
  }

  convertPrice(priceInRub: number, targetCurrency: Currency = this.currency()): number {
    const currentRate = this.exchangeRate();
    
    if (targetCurrency === 'RUB') {
      return priceInRub;
    } else if (targetCurrency === 'USD') {
      return Number((priceInRub / currentRate).toFixed(2));
    }
    return priceInRub;
  }

  formatPrice(price: number, currency: Currency = this.currency()): string {
    const convertedPrice = this.convertPrice(price, currency);

    if (currency === 'RUB') {
      return `${convertedPrice} ₽`;
    } else if (currency === 'USD') {
      return `${convertedPrice} $`;
    }
    
    return `${convertedPrice}`;
  }
}
