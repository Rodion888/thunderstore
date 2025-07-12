import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, HostListener, OnInit, signal, PLATFORM_ID, DestroyRef } from '@angular/core';
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
import { of, delay, tap, expand, takeWhile } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  public currencyService = inject(CurrencyService);
  public translationService = inject(TranslationService);

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
    const hasProducts = this.products().length > 0;
    
    if (hasProducts) {
      this.showLoader.set(false);
      this.visibleProductsCount.set(this.products().length);
      
      if (isPlatformBrowser(this.platformId)) {
        this.startProductAnimation();
      }
    } else {
      if (isPlatformBrowser(this.platformId)) {
        of(null).pipe(
          takeUntilDestroyed(this.destroyRef),
          delay(1000),
          tap(() => {
            this.showLoader.set(false);
            this.cdr.markForCheck();
          }),
          delay(100),
          tap(() => this.startProductAnimation())
        ).subscribe();
      } else {
        this.showLoader.set(false);
      }
    }
  }

  private startProductAnimation(): void {
    const totalProducts = this.products().length;
    
    if (totalProducts === 0) return;
    
    of(0).pipe(
        takeUntilDestroyed(this.destroyRef),
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

  addToCart(product: Product, size: string) {
    this.cartService.addToCart(product, size);
  }

  @HostListener('window:scroll', ['$event'])
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
          takeUntilDestroyed(this.destroyRef),
          delay(100),
          tap(() => this.continueProductAnimation(currentVisibleCount))
        ).subscribe();
    }
  }

  private continueProductAnimation(startIndex: number): void {
    const totalProducts = this.products().length;
    
    of(startIndex).pipe(
        takeUntilDestroyed(this.destroyRef),
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

  onCurrencyChange(currency: string) {
    this.currencyService.setCurrency(currency as Currency);
  }

  onLanguageChange(language: string) {
    this.translationService.setLanguage(language as Language);
  }
}
