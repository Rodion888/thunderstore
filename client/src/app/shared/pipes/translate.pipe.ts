import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({
  name: 'translate',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  
  transform(text: string): string {
    if (!text) return '';
    
    return this.translationService.translate(text);
  }
}
