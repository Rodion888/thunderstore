import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../core/types/product.types';
import { CurrencyConverterPipe } from '../../pipes/currency-converter.pipe';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  imports: [CommonModule, RouterModule, CurrencyConverterPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() product!: Product;
}
