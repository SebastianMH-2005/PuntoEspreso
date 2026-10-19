import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Punto Espresso — Café de especialidad en Lima',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  // Siguientes pasos: catalogo, carrito, checkout, login, registro, mis-pedidos, admin...
  {
    path: '**',
    title: 'Página no encontrada — Punto Espresso',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
