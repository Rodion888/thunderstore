import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, HostListener, OnInit, OnDestroy, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CardComponent } from '../../shared/components/card/card.component';
import { Currency, CurrencyService } from '../../core/services/currency.service';
import { FormsModule } from '@angular/forms';
import { SelectOption, CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';
import { TranslationService, Language } from '../../core/services/translation.service';
import { Product } from '../../core/types/product.types';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { of, delay, tap, expand, takeWhile, takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardComponent,
    CustomSelectComponent,
    TranslatePipe,
    LoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  public currencyService = inject(CurrencyService);
  public translationService = inject(TranslationService);

  private destroy$ = new Subject<void>();

  loading = this.productService.loading;
  loadingMore = this.productService.loadingMore;
  hasMore = this.productService.hasMore;
  products = this.productService.products;
  
  showLoader = signal(true);
  visibleProductsCount = signal(0);
  
  currencyOptions: SelectOption[] = [
    { label: '₽', value: 'RUB' },
    { label: '$', value: 'USD' }
  ];
  
  languageOptions: SelectOption[] = [
    { label: 'RU', value: 'RU' },
    { label: 'EN', value: 'EN' }
  ];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.showLoader.set(false);
      this.visibleProductsCount.set(this.products().length);
      return;
    }

    const hasProducts = this.products().length > 0;
    
    if (hasProducts) {
      this.showLoader.set(false);
      this.startProductAnimation();
    } else {
      of(null).pipe(
          takeUntil(this.destroy$),
          delay(1000),
          tap(() => {
            this.showLoader.set(false);
            this.cdr.markForCheck();
          }),
          delay(100),
          tap(() => this.startProductAnimation())
        ).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startProductAnimation(): void {
    const totalProducts = this.products().length;
    
    if (totalProducts === 0) return;
    
    of(0).pipe(
        takeUntil(this.destroy$),
        expand(currentIndex => 
          currentIndex < totalProducts - 1 
            ? of(currentIndex + 1).pipe(delay(200))
            : of()
        ),
        takeWhile(currentIndex => currentIndex < totalProducts),
        tap(currentIndex => {
          this.visibleProductsCount.set(currentIndex + 1);
          this.cdr.markForCheck();
        })
      ).subscribe();
  }

  onCurrencyChange(currency: string): void {
    this.currencyService.setCurrency(currency as Currency);
    this.cdr.markForCheck();
  }
  
  onLanguageChange(language: string): void {
    this.translationService.setLanguage(language as Language);
    this.cdr.markForCheck();
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    
    const allCurrentProductsVisible = this.visibleProductsCount() >= this.products().length;
    
    if (!allCurrentProductsVisible || !this.hasMore()) return;
  
    const scrollPosition = element.scrollTop + element.clientHeight;
    const bottomPosition = element.scrollHeight - 100;
  
    if (scrollPosition >= bottomPosition) {
      const currentVisibleCount = this.visibleProductsCount();
      this.productService.loadMoreProducts();
      
      of(null).pipe(
          takeUntil(this.destroy$),
          delay(100),
          tap(() => this.continueProductAnimation(currentVisibleCount))
        ).subscribe();
    }
  }

  private continueProductAnimation(startIndex: number): void {
    const totalProducts = this.products().length;
    
    of(startIndex).pipe(
        takeUntil(this.destroy$),
        expand(currentIndex => 
          currentIndex < totalProducts - 1 
            ? of(currentIndex + 1).pipe(delay(200))
            : of()
        ),
        takeWhile(currentIndex => currentIndex < totalProducts),
        tap(currentIndex => {
          this.visibleProductsCount.set(currentIndex + 1);
          this.cdr.markForCheck();
        })
      ).subscribe();
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
