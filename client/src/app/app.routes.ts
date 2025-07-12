import { Routes } from '@angular/router';
import { SuccessComponent } from './features/success/success.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
  { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
  { path: 'product/:id', loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'info/:section', loadComponent: () => import('./features/info-page/info-page.component').then(m => m.InfoPageComponent) },
  { path: 'success', component: SuccessComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
