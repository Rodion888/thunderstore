import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Product } from '../types/product.types';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class ProductApi {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private apiUrl = `${this.config.apiUrl}/products`;

  getTotal() {
    return this.http.get<{ total: number, products: Product[] }>(this.apiUrl);
  }

  getProducts(limit: number, page: number) {
    return this.http.get<{ products: Product[] }>(
      `${this.apiUrl}?_limit=${limit}&_page=${page}`
    );
  }

  getProductById(id: number) {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}