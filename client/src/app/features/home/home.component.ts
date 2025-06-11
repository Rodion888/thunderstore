import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private cdr = inject(ChangeDetectorRef);

  public currencyService = inject(CurrencyService);
  public translationService = inject(TranslationService);

  loading = this.productService.loading;
  loadingMore = this.productService.loadingMore;
  hasMore = this.productService.hasMore;
  products = this.productService.products;
  
  currencyOptions: SelectOption[] = [
    { label: '₽', value: 'RUB' },
    { label: '$', value: 'USD' }
  ];
  
  languageOptions: SelectOption[] = [
    { label: 'RU', value: 'RU' },
    { label: 'EN', value: 'EN' }
  ];

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
