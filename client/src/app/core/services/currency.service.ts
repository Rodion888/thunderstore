import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export enum Currency {
  RUB = 'RUB',
  USD = 'USD'
}

interface StoredExchangeRate {
  rate: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);
  
  private fallbackExchangeRate = 90;
  private exchangeRate = new BehaviorSubject<number>(this.fallbackExchangeRate);
  private currentCurrency = new BehaviorSubject<Currency>(Currency.RUB);

  public exchangeRate$ = this.exchangeRate.asObservable();
  public currentCurrency$ = this.currentCurrency.asObservable();
  public currency = signal<Currency>(Currency.RUB);
  
  private readonly STORAGE_KEY = 'exchange_rate_data';
  private readonly RATE_EXPIRY_TIME = 86400000;
  private readonly API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
  
  constructor() {
    this.initExchangeRate();
  }

  private initExchangeRate(): void {
    const storedData = this.getStoredExchangeRate();
    
    if (storedData && !this.isRateExpired(storedData.timestamp)) {
      this.exchangeRate.next(storedData.rate);
    } else {
      this.fetchExchangeRate();
    }
  }
  
  private isRateExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.RATE_EXPIRY_TIME;
  }
  
  private getStoredExchangeRate(): StoredExchangeRate | null {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : null;
  }
  
  private storeExchangeRate(rate: number): void {
    const data: StoredExchangeRate = {
      rate,
      timestamp: Date.now()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  fetchExchangeRate(): void {
    this.http.get<any>(this.API_URL).pipe(
      tap(response => {
        if (response && response.usd && response.usd.rub) {
          const rate = response.usd.rub;
          this.exchangeRate.next(rate);
          this.storeExchangeRate(rate);
        }
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  setCurrency(currency: Currency): void {
    this.currentCurrency.next(currency);
    this.currency.set(currency);
  }

  convertPrice(priceInRub: number, targetCurrency: Currency = this.currency()): number {
    const currentRate = this.exchangeRate.value;
    
    if (targetCurrency === Currency.RUB) {
      return priceInRub;
    } else if (targetCurrency === Currency.USD) {
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
