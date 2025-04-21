import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appTranslate]',
  standalone: true
})
export class TranslateDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private translationService = inject(TranslationService);
  private subscription?: Subscription;
  
  @Input('appTranslate') key: string = '';
  @Input('appTranslateParams') params: Record<string, string> = {};
  
  // Сохраняем оригинальный текст для возможности восстановления
  private originalText?: string;
  
  ngOnInit(): void {
    // Сохраняем оригинальный текст при первой инициализации
    this.originalText = this.el.nativeElement.textContent?.trim();
    
    // Подписываемся на изменения языка
    this.subscription = this.translationService.getCurrentLang().subscribe(() => {
      this.updateText();
    });
    
    // Сразу обновляем текст
    this.updateText();
  }
  
  ngOnDestroy(): void {
    // Отписываемся при уничтожении компонента
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  private updateText(): void {
    if (!this.key && this.originalText) {
      // Если ключ не задан, используем оригинальный текст как ключ
      this.el.nativeElement.textContent = this.translationService.translate(
        this.originalText, 
        this.originalText
      );
    } else if (this.key) {
      // Если ключ задан, используем его
      this.el.nativeElement.textContent = this.translationService.translate(
        this.key, 
        this.originalText || this.key
      );
    }
  }
} 