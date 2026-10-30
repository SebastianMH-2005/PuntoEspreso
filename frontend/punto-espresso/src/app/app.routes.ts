import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { invitadoGuard, rolGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';

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
    path: 'nosotros',
    title: 'Nosotros | Punto Espresso',
    data: {
      descripcion:
        'Conoce la historia de Punto Espresso: café peruano de especialidad, tostado artesanal de origen y baristas certificados en Lima.',
    },
    loadComponent: () => import('./features/about/about').then((m) => m.About),
  },
  {
    path: 'contacto',
    title: 'Contacto y locales en Lima | Punto Espresso',
    data: {
      descripcion:
        'Encuentra tu local Punto Espresso más cercano en Lima: direcciones, horarios y cómo llegar a nuestras cafeterías de San Miguel y San Isidro.',
    },
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
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
      {
        path: '',
        pathMatch: 'full',
        // El administrador empieza en el resumen; el operador, directo en las órdenes
        redirectTo: () => (inject(AuthService).rol() === 'ADMIN' ? 'resumen' : 'ordenes'),
      },
      {
        path: 'resumen',
        title: 'Resumen | Panel de administración',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'ordenes',
        title: 'Órdenes | Panel de administración',
        loadComponent: () =>
          import('./features/admin/orders/admin-orders').then((m) => m.AdminOrders),
      },
      // Productos, sedes y personal: solo ADMIN
      {
        path: 'productos',
        canActivate: [rolGuard('ADMIN')],
        children: [
          {
            path: '',
            title: 'Productos | Panel de administración',
            loadComponent: () =>
              import('./features/admin/products/admin-products').then((m) => m.AdminProducts),
          },
          {
            path: 'nuevo',
            title: 'Nuevo producto | Panel de administración',
            loadComponent: () =>
              import('./features/admin/products/admin-product-form').then(
                (m) => m.AdminProductForm,
              ),
          },
          {
            path: ':id/editar',
            title: 'Editar producto | Panel de administración',
            loadComponent: () =>
              import('./features/admin/products/admin-product-form').then(
                (m) => m.AdminProductForm,
              ),
          },
        ],
      },
      {
        path: 'sedes',
        title: 'Sedes | Panel de administración',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () => import('./features/admin/sedes/admin-sedes').then((m) => m.AdminSedes),
      },
      {
        path: 'personal',
        title: 'Personal | Panel de administración',
        canActivate: [rolGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/personal/admin-personal').then((m) => m.AdminPersonal),
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
