import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Solo se envía el token a nuestra propia API, nunca a terceros
  const peticion =
    token && req.url.startsWith(environment.apiUrl)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 con sesión iniciada = el token venció o ya no es válido
      if (error.status === 401 && token && !req.url.includes('/api/auth/')) {
        auth.cerrarSesion('/login');
      }
      return throwError(() => error);
    }),
  );
};