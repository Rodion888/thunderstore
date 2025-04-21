import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/types/product.types';
import { CartService } from '../../core/services/cart.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustomSelectComponent, SelectOption } from '../../shared/components/custom-select/custom-select.component';
import { BackgroundVideoComponent } from '../../shared/components/background-video/background-video.component';
import { BackgroundService } from '../../core/services/background.service';
import { AppCurrencyPipe } from "../../shared/pipes/currency.pipe";
import { TranslatePipe } from "../../shared/pipes/translate.pipe";

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CustomSelectComponent,
    BackgroundVideoComponent,
    AppCurrencyPipe,
    TranslatePipe
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  private backgroundService = inject(BackgroundService);

  product: Product | null = null;
  productId: number | null = null;
  selectedSize: string = '';
  currentImageIndex: number = 0;
  images: string[] = [];
  currentImage: string = '';
  fullscreenImage: string | null = null;

  constructor() {
    this.backgroundService.setVideo('assets/videos/bg.mp4');
  }

  prevImage(): void {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    this.currentImage = this.images[this.currentImageIndex];
  }
  
  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    this.currentImage = this.images[this.currentImageIndex];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      if (Number(params.get('id'))) {
        this.productId = Number(params.get('id'));
      }
    });

    if (this.productId) {
      this.productService.getProductById(this.productId).subscribe({
        next: (product) => {
          this.product = product;
          if (this.product) {
            this.images = [this.product.images.front, this.product.images.back];
            this.currentImage = this.images[this.currentImageIndex];
            this.detectCurrentAvailableSize();
          }
          this.cdr.detectChanges();
        },
      });
    }
  }

  openFullscreen(imageUrl: string): void {
    this.fullscreenImage = imageUrl;
  }
  
  closeFullscreen(): void {
    this.fullscreenImage = null;
  }

  getAvailableSizes(): SelectOption[] {
    if (!this.product) return [];
  
    return Object.entries(this.product.stock).map(([size, count]) => ({
      label: size,
      value: size,
      disabled: count === 0,
    }));
  }

  getAvailableSizesText(): string {
    if (!this.product) return '';
  
    return Object.entries(this.product.stock)
      .filter(([_, count]) => count > 0)
      .map(([size]) => size)
      .join(', ');
  }

  addToCart() {
    if (!this.product || !this.selectedSize) return;
    this.cartService.addToCart(this.product, this.selectedSize);
  }

  private detectCurrentAvailableSize() {
    const availableSizes = this.getAvailableSizes().filter(size => !size.disabled);
    if (availableSizes.length > 0) {
      this.selectedSize = availableSizes[0].value;
    }
  }
}

export default ProductDetailComponent;
