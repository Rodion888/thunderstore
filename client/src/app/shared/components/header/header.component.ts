import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { computed } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, LogoComponent],
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
