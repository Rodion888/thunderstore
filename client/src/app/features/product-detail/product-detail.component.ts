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
  selectedSize: string = '';
  currentImageIndex: number = 0;
  images: string[] = [];
  currentImage: string = '';
  fullscreenImage: string | null = null;
  availableSizes: SelectOption[] = [];

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
      this.loadProduct(Number(params.get('id')));
    });
  }

  private loadProduct(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          this.product = product;
          this.setupImages();
          this.setupSizes();
          this.cdr.detectChanges();
        }
      },
    });
  }

  private setupImages(): void {
    if (!this.product) return;
    this.images = [this.product.images.front, this.product.images.back];
    this.currentImage = this.images[0];
  }

  private setupSizes(): void {
    if (!this.product) return;
    
    this.availableSizes = Object.entries(this.product.stock)
      .filter(([_, count]) => count > 0)
      .map(([size]) => ({
        label: size,
        value: size,
        disabled: false,
      }));

    if (this.availableSizes.length > 0) {
      this.selectedSize = this.availableSizes[0].value;
    }
  }

  openFullscreen(imageUrl: string): void {
    this.fullscreenImage = imageUrl;
  }
  
  closeFullscreen(): void {
    this.fullscreenImage = null;
  }

  getAvailableSizesText(): string {
    return this.availableSizes.map(size => size.label).join(', ');
  }

  addToCart(): void {
    if (this.product && this.selectedSize) {
      this.cartService.addToCart(this.product, this.selectedSize);
    }
  }

  onSizeChange(size: string): void {
    this.selectedSize = size;
  }
}

export default ProductDetailComponent;
