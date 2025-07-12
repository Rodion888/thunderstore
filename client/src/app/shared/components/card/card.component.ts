import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/types/product.types';
import { AppCurrencyPipe } from '../../pipes/currency.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  imports: [CommonModule, RouterModule, AppCurrencyPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() product!: Product;
  @Input() isFirstCard: boolean = false;

  imageLoaded = signal(false);

  onImageLoad() {
    this.imageLoaded.set(true);
  }
}
