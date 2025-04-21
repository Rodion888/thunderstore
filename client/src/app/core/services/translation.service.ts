import { Injectable, signal } from '@angular/core';

export type Language = 'RU' | 'EN';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {  
  public currentLang = signal<Language>('RU');

  private readonly LANGUAGE_STORAGE_KEY = 'language';

  private readonly translations: Record<Language, Record<string, string>> = {
    RU: {
      'price': 'Цена',
      'cart': 'Корзина',
      'size': 'Размер',
      'quantity': 'Количество',
      'add-to-cart': 'Добавить в корзину',
      'select-size': 'Выберите размер',
      't-shirt-size': 'Размер футболки',
      'contact-us': 'контакты',
      'terms': 'условия',
      'privacy': 'конфиденциальность',
      'select-currency': 'Выберите валюту',
      'select-language': 'Выберите язык',
      'cart-empty': 'Ваша корзина пуста',
      'clear-cart': 'Очистить корзину',
      'checkout': 'Оформить заказ',
      'material': 'Материал',
      'composition': 'Состав',
      'sizes': 'Размеры',
      'total': 'Итого',
      'for-amount': 'на сумму',
      'item-one': 'товар',
      'item-few': 'товара',
      'item-many': 'товаров',
      'delivery-type': 'Тип доставки',
      'user-data': 'Ваши данные',
      'payment-method': 'Способ оплаты',
      'select-delivery-type': 'Выберите тип доставки',
      'fullname': 'Полное имя',
      'fullname-placeholder': 'Ф.И.О',
      'phone': 'Телефон',
      'phone-placeholder': 'Введите ваш номер телефона',
      'email': 'Email',
      'email-placeholder': 'Введите вашу электронную почту',
      'city': 'Город доставки',
      'city-placeholder': 'Введите ваш город',
      'address': 'Адрес доставки',
      'address-placeholder': 'Введите ваш адрес',
      'comment': 'Комментарий',
      'comment-placeholder': 'Дополнительная информация',
      'payment-methods': 'Способы оплаты',
      'select-payment-method': 'Выберите способ оплаты',
      'payment-note': '*Если Вы не оплатили заказ в течение 20 минут, он аннулируется',
      'continue': 'Продолжить',
      'Самовывоз в Краснодаре': 'Самовывоз в Краснодаре',
      'Курьер по Краснодару': 'Курьер по Краснодару',
      'СДЭК до ПВЗ': 'СДЭК до ПВЗ',
      'Онлайн-оплата (VISA / MASTERCARD / МИР / СБП / T-PAY / SBERPAY)': 'Онлайн-оплата (VISA / MASTERCARD / МИР / СБП / T-PAY / SBERPAY)',
      'Crypto & Bank Card - Bank Card, BTC, ETH, USDT': 'Crypto & Bank Card - Bank Card, BTC, ETH, USDT',
      'Это поле обязательно': 'Это поле обязательно',
      'Введите корректный email': 'Введите корректный email',
      'Неверный формат': 'Неверный формат',
      'Некорректное значение': 'Некорректное значение'
    },
    EN: {
      'price': 'Price',
      'cart': 'Cart',
      'size': 'Size',
      'quantity': 'Quantity',
      'add-to-cart': 'Add to cart',
      'select-size': 'Select size',
      't-shirt-size': 'T-shirt size',
      'contact-us': 'contact us',
      'terms': 'terms',
      'privacy': 'privacy',
      'select-currency': 'Select currency',
      'select-language': 'Select language',
      'cart-empty': 'Your cart is empty',
      'clear-cart': 'Clear cart',
      'checkout': 'Checkout',
      'material': 'Material',
      'composition': 'Composition',
      'sizes': 'Sizes',
      'total': 'Total',
      'for-amount': 'for',
      'item-one': 'item',
      'item-few': 'items',
      'item-many': 'items',
      'delivery-type': 'Delivery Type',
      'user-data': 'Your Information',
      'payment-method': 'Payment Method',
      'select-delivery-type': 'Please select a delivery type',
      'fullname': 'Full Name',
      'fullname-placeholder': 'Full Name',
      'phone': 'Phone',
      'phone-placeholder': 'Enter your phone number',
      'email': 'Email',
      'email-placeholder': 'Enter your email address',
      'city': 'City',
      'city-placeholder': 'Enter your city',
      'address': 'Delivery Address',
      'address-placeholder': 'Enter your address',
      'comment': 'Comment',
      'comment-placeholder': 'Additional information',
      'payment-methods': 'Payment Methods',
      'select-payment-method': 'Please select a payment method',
      'payment-note': '*If you do not pay within 20 minutes, your order will be canceled',
      'continue': 'Continue',
      'Самовывоз в Краснодаре': 'Pickup in Krasnodar',
      'Курьер по Краснодару': 'Courier in Krasnodar',
      'СДЭК до ПВЗ': 'CDEK to pickup point',
      'Онлайн-оплата (VISA / MASTERCARD / МИР / СБП / T-PAY / SBERPAY)': 'Online Payment (VISA / MASTERCARD / MIR / SBP / T-PAY / SBERPAY)',
      'Crypto & Bank Card - Bank Card, BTC, ETH, USDT': 'Crypto & Bank Card - Bank Card, BTC, ETH, USDT',
      'Это поле обязательно': 'This field is required',
      'Введите корректный email': 'Enter a valid email',
      'Неверный формат': 'Invalid format',
      'Некорректное значение': 'Invalid value'
    }
  };
  
  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    const initialLang = localStorage.getItem(this.LANGUAGE_STORAGE_KEY) as Language;
    this.setLanguage(initialLang || 'RU');
  }

  setLanguage(lang: Language): void {
    if (this.currentLang() !== lang) {
      this.currentLang.set(lang);
      localStorage.setItem(this.LANGUAGE_STORAGE_KEY, lang);
    }
  }

  translate(key: string, defaultValue: string = key): string {
    const lang = this.currentLang();
    
    if (this.translations[lang]?.[key]) {
      return this.translations[lang][key];
    }
    
    return defaultValue;
  }
} 