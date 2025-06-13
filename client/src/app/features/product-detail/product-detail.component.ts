import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { FormsModule } from '@angular/forms';
import { Product } from '../../core/types/product.types';
import { CartService } from '../../core/services/cart.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustomSelectComponent, SelectOption } from '../../shared/components/custom-select/custom-select.component';
import { AppCurrencyPipe } from "../../shared/pipes/currency.pipe";
import { TranslatePipe } from "../../shared/pipes/translate.pipe";
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { of, delay, tap } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CustomSelectComponent,
    AppCurrencyPipe,
    TranslatePipe,
    LoaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  product: Product | null = null;
  selectedSize: string = '';
  currentImage: string = '';
  fullscreenImage: string | null = null;
  availableSizes: SelectOption[] = [];
  showLoader = signal(true);
  showLeftSide = signal(false);
  showRightSide = signal(false);

  private currentImageIndex: number = 0;
  private images: string[] = [];

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

  private loadProduct(id: number): void {
    this.showLoader.set(true);
    this.showLeftSide.set(false);
    this.showRightSide.set(false);
    
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          this.product = product;
          this.setupImages();
          this.setupSizes();
          this.cdr.detectChanges();
          
          this.startContentAnimation();
        }
      },
    });
  }

  private startContentAnimation(): void {
    of(null)
      .pipe(
        delay(1000),
        tap(() => {
          this.showLoader.set(false);
          this.cdr.markForCheck();
        }),
        delay(100),
        tap(() => {
          this.showLeftSide.set(true);
          this.cdr.markForCheck();
        }),
        delay(300),
        tap(() => {
          this.showRightSide.set(true);
          this.cdr.markForCheck();
        })
      ).subscribe();
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
}

export default ProductDetailComponent;
