import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { computed } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { LogoComponent } from '../logo/logo.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, LogoComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private router = inject(Router);
  private cartService = inject(CartService);

  cartItemsCount = computed(() => this.cartService.getTotalItemsCount() || '');

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
