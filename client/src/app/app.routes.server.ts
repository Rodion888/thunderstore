import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server
  },
  {
    path: 'cart',
    renderMode: RenderMode.Server
  },
  {
    path: 'checkout',
    renderMode: RenderMode.Server
  },
  {
    path: 'success',
    renderMode: RenderMode.Server
  },
  {
    path: 'info/:section',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { section: 'contact-us' },
      { section: 'terms' },
      { section: 'privacy' }
    ]
  },
  {
    path: 'product/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
