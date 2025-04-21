import { Injectable, Optional, SkipSelf, InjectionToken, Inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'RU' | 'EN';

// Токен для предоставления переводов на уровне компонентов
export const TRANSLATIONS = new InjectionToken<Record<string, Record<string, string>>>('TRANSLATIONS');

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLang = new BehaviorSubject<Language>('RU');
  
  // Глобальные переводы
  private globalTranslations: Record<string, Record<string, string>> = {
    RU: {
      'product.price': 'Цена',
    },
    EN: {
      'product.price': 'Price',
    }
  };
  
  // Локальные переводы, предоставленные через токен
  constructor(
    // Проверяем, существует ли родительский сервис
    @Optional() @SkipSelf() private parentService: TranslationService,
    // Внедряем локальные переводы, если они предоставлены (опционально)
    @Optional() @Inject(TRANSLATIONS) private localTranslations: Record<string, Record<string, string>>
  ) {
    // Если есть родительский сервис, синхронизируем язык с ним
    if (parentService) {
      parentService.getCurrentLang().subscribe(lang => {
        this.currentLang.next(lang);
      });
    }
  }

  /**
   * Получить текущий язык
   */
  getCurrentLang(): Observable<Language> {
    // Используем родительский сервис, если он есть
    return this.parentService ? this.parentService.getCurrentLang() : this.currentLang.asObservable();
  }

  /**
   * Установить текущий язык
   */
  setLanguage(lang: Language): void {
    // Если есть родительский сервис, делегируем ему
    if (this.parentService) {
      this.parentService.setLanguage(lang);
    } else {
      this.currentLang.next(lang);
    }
  }

  /**
   * Перевести ключ на текущий язык
   * @param key Ключ перевода
   * @param defaultValue Значение по умолчанию, если перевод не найден
   */
  translate(key: string, defaultValue: string = key): string {
    const currentLang = this.currentLang.getValue();
    
    // Сначала проверяем локальные переводы
    if (this.localTranslations && 
        this.localTranslations[currentLang] && 
        this.localTranslations[currentLang][key]) {
      return this.localTranslations[currentLang][key];
    }
    
    // Затем проверяем родительский сервис
    if (this.parentService) {
      return this.parentService.translate(key, defaultValue);
    }
    
    // Наконец, проверяем глобальные переводы
    if (this.globalTranslations[currentLang] && this.globalTranslations[currentLang][key]) {
      return this.globalTranslations[currentLang][key];
    }
    
    // Если перевод не найден, возвращаем значение по умолчанию
    return defaultValue;
  }
} 