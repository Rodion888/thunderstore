import { HttpClient } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Product } from "../types/product.types";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);

  private page = 1;
  private limit = 10;
  private totalProducts = 0;

  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  loadingMore = signal<boolean>(false);
  hasMore = signal<boolean>(true);

  constructor() {
    this.fetchTotalProducts();
  }

  private fetchTotalProducts() {
    this.http.get<{ total: number, products: Product[] }>("http://localhost:3000/products")
      .subscribe(response => {
        this.totalProducts = response.total;
        this.loadProducts();
      });
  }

  private loadProducts() {
    this.http.get<{ products: Product[] }>(`http://localhost:3000/products?_limit=${this.limit}&_page=${this.page}`)
      .subscribe(response => {
        this.products.set(response.products);
        this.loading.set(false);
        this.page++;

        if (this.products().length >= this.totalProducts) {
          this.hasMore.set(false);
        }
      });
  }

  loadMoreProducts() {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.http.get<{ products: Product[] }>(
      `http://localhost:3000/products?_limit=${this.limit}&_page=${this.page}`
    ).subscribe(response => {
      if (response.products.length) {
        this.products.update(products => [...products, ...response.products]);
        this.page++;
      }

      if (this.products().length >= this.totalProducts) {
        this.hasMore.set(false);
      }

      this.loadingMore.set(false);
    });
  }

  getProductById(id: number) {
    return this.http.get<Product>(`http://localhost:3000/products/${id}`);
  }
}

