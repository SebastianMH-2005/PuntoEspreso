import { Routes } from '@angular/router';
import { invitadoGuard, rolGuard } from './core/guards/auth.guard';

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
  {
    path: 'carrito',
    title: 'Mi carrito | Punto Espresso',
    data: { noindex: true },
    loadComponent: () => import('./features/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    title: 'Finalizar pedido | Punto Espresso',
    canActivate: [rolGuard('CLIENTE')],
    data: { noindex: true },
    loadComponent: () => import('./features/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'mis-pedidos',
    title: 'Mis pedidos | Punto Espresso',
    canActivate: [rolGuard('CLIENTE')],
    data: { noindex: true },
    loadComponent: () => import('./features/orders/orders').then((m) => m.Orders),
  },
  {
    path: 'admin',
    title: 'Panel de administración | Punto Espresso',
    canActivate: [rolGuard('ADMIN', 'OPERADOR')],
    data: { noindex: true },
    loadComponent: () => import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ordenes' },
      {
        path: 'ordenes',
        title: 'Órdenes | Panel de administración',
        loadComponent: () =>
          import('./features/admin/orders/admin-orders').then((m) => m.AdminOrders),
      },
      // Productos, sedes y personal: solo ADMIN. Se migran a Angular en los siguientes pasos.
      {
        path: 'productos',
        title: 'Productos | Panel de administración',
        canActivate: [rolGuard('ADMIN')],
        data: { seccion: 'Productos' },
        loadComponent: () =>
          import('./features/admin/pending/admin-pending').then((m) => m.AdminPending),
      },
      {
        path: 'sedes',
        title: 'Sedes | Panel de administración',
        canActivate: [rolGuard('ADMIN')],
        data: { seccion: 'Sedes' },
        loadComponent: () =>
          import('./features/admin/pending/admin-pending').then((m) => m.AdminPending),
      },
      {
        path: 'personal',
        title: 'Personal | Panel de administración',
        canActivate: [rolGuard('ADMIN')],
        data: { seccion: 'Personal' },
        loadComponent: () =>
          import('./features/admin/pending/admin-pending').then((m) => m.AdminPending),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada | Punto Espresso',
    data: { noindex: true },
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
