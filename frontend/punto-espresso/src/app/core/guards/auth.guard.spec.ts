import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, invitadoGuard, rolGuard } from './auth.guard';

function iniciarSesion(rol: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  localStorage.setItem('token', `cabecera.${btoa(JSON.stringify({ exp }))}.firma`);
  localStorage.setItem('nombre', 'Ana');
  localStorage.setItem('rol', rol);
}

describe('guards de rutas', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  function ejecutar(guard: CanActivateFn, url = '/checkout') {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  const aTexto = (resultado: unknown) => TestBed.inject(Router).serializeUrl(resultado as UrlTree);

  it('authGuard deja pasar con sesión iniciada', () => {
    iniciarSesion('CLIENTE');
    expect(ejecutar(authGuard)).toBe(true);
  });

  it('authGuard manda al login recordando la ruta pedida', () => {
    expect(aTexto(ejecutar(authGuard))).toBe('/login?redirect=%2Fcheckout');
  });

  it('rolGuard solo deja pasar a los roles indicados', () => {
    iniciarSesion('CLIENTE');
    expect(aTexto(ejecutar(rolGuard('ADMIN', 'OPERADOR'), '/admin'))).toBe('/');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    iniciarSesion('ADMIN');
    expect(ejecutar(rolGuard('ADMIN', 'OPERADOR'), '/admin')).toBe(true);
  });

  it('invitadoGuard saca del login a quien ya inició sesión', () => {
    expect(ejecutar(invitadoGuard)).toBe(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    iniciarSesion('CLIENTE');
    expect(aTexto(ejecutar(invitadoGuard))).toBe('/');
  });
});