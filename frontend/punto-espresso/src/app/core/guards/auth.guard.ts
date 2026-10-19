import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

// Los guards solo mejoran la experiencia: la seguridad real la exige el backend en /api/**
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaLogueado()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaLogueado()) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    }
    const rol = auth.rol();
    return rol !== null && roles.includes(rol) ? true : router.createUrlTree(['/']);
  };