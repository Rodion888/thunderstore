import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from './core/services/cart.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private router = inject(Router);
  private cartService = inject(CartService);

  cartItemsCount = computed(
    () => this.cartService.cartItems().reduce((total, item) => total + item.quantity, 0) || ''
  );

  goTo(route: string) {
    this.router.navigate([route]);
  }
}
