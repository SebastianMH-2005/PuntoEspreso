import { Routes } from '@angular/router';
import { invitadoGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Punto Espresso | Café de especialidad en Lima',
    data: {
      descripcion:
        'Cafetería y tostaduría en Lima. Café de especialidad, geisha, frappés, cold brew y bebidas frías. Visítanos en San Miguel y San Isidro o pide en línea.',
    },
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'catalogo',
    title: 'Catálogo de café y bebidas | Punto Espresso',
    data: {
      descripcion:
        'Café de especialidad, geisha, frappés, cold brew y café en grano de Punto Espresso. Mira los precios y haz tu pedido en línea en Lima.',
    },
    loadComponent: () => import('./features/catalog/catalog').then((m) => m.Catalog),
  },
  {
    path: 'login',
    title: 'Iniciar sesión | Punto Espresso',
    canActivate: [invitadoGuard],
    data: { noindex: true },
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Crear cuenta | Punto Espresso',
    canActivate: [invitadoGuard],
    data: { noindex: true },
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  // Siguientes pasos: carrito, checkout, mis-pedidos, admin...
  {
    path: '**',
    title: 'Página no encontrada | Punto Espresso',
    data: { noindex: true },
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
