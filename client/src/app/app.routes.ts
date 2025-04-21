import { Routes } from '@angular/router';
import { SuccessComponent } from './features/success/success.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.default) },
  { path: 'cart', loadComponent: () => import('./features/cart/cart.component').then(m => m.default) },
  { path: 'checkout', loadComponent: () => import('./features/checkout/checkout.component').then(m => m.default) },
  { path: 'product/:id', loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.default) },
  { path: 'info/:section', loadComponent: () => import('./features/info-page/info-page.component').then(m => m.default) },
  { path: 'success', component: SuccessComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
