import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { CardComponent } from '../../shared/components/card/card.component';
import { CurrencyService } from '../../core/services/currency.service';
import { Currency } from '../../core/services/currency.service';
import { BackgroundVideoComponent } from '../../shared/components/background-video/background-video.component';
import { BackgroundService } from '../../core/services/background.service';
import { FormsModule } from '@angular/forms';
import { SelectOption, CustomSelectComponent } from '../../shared/components/custom-select/custom-select.component';
import { TranslationService, Language } from '../../core/services/translation.service';
import { Product } from '../../core/types/product.types';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, BackgroundVideoComponent, CustomSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private backgroundService = inject(BackgroundService);
  private currencyService = inject(CurrencyService);
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  loading = this.productService.loading;
  loadingMore = this.productService.loadingMore;
  hasMore = this.productService.hasMore;
  products = this.productService.products;
  
  selectedCurrency: Currency = Currency.RUB;
  currencyOptions: SelectOption[] = [
    { label: '₽', value: Currency.RUB },
    { label: '$', value: Currency.USD }
  ];
  
  selectedLanguage: Language = 'RU';
  languageOptions: SelectOption[] = [
    { label: '🇷🇺 RU', value: 'RU' },
    { label: '🇬🇧 EN', value: 'EN' }
  ];

  constructor() {
    this.backgroundService.setVideo('assets/videos/bghome.mp4?version=1');
    this.currencyService.currentCurrency$.subscribe(currency => {
      this.selectedCurrency = currency;
      this.cdr.markForCheck();
    });
    
    this.translationService.getCurrentLang().subscribe(lang => {
      this.selectedLanguage = lang;
      this.cdr.markForCheck();
    });
  }

  onCurrencyChange(currency: string): void {
    this.selectedCurrency = currency as Currency;
    this.currencyService.setCurrency(this.selectedCurrency);
    this.cdr.markForCheck();
  }
  
  onLanguageChange(language: Language): void {
    this.translationService.setLanguage(language);
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
