import { Component, inject, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { RouterModule } from '@angular/router';
import { Product } from '../../core/types/product.types';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../shared/components/card/card.component';
import { BackgroundService } from '../../core/services/background.service';
import { BackgroundVideoComponent } from '../../shared/components/background-video/background-video.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, BackgroundVideoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private backgroundService = inject(BackgroundService);

  loading = this.productService.loading;
  loadingMore = this.productService.loadingMore;
  hasMore = this.productService.hasMore;
  products = this.productService.products;

  constructor() {
    this.backgroundService.setVideo('assets/videos/bghome.mp4?version=1');
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
  
    if (!this.hasMore()) return;
  
    const scrollPosition = element.scrollTop + element.clientHeight;
    const bottomPosition = element.scrollHeight - 100;
  
    if (scrollPosition >= bottomPosition) {
      this.productService.loadMoreProducts();
    }
  }

  @HostListener('window:pagehide')
  onPageHide() {
    this.cartService.clearCart();
  }

  addToCart(product: Product, size: string) {
    if (!size) return;
    
    this.cartService.addToCart(product, size);
  }
  
  isOutOfStock(product: Product): boolean {
    return Object.values(product.stock).every(qty => qty === 0);
  }
}

export default HomeComponent;
