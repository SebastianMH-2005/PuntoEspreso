import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Login } from './login';

const URL_LOGIN = `${environment.apiUrl}/api/auth/login`;

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return { fixture, el, http, navegar };
  }

  function escribir(el: HTMLElement, id: string, valor: string) {
    const campo = el.querySelector(`#${id}`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  const enviar = (el: HTMLElement) =>
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

  it('no envía nada y muestra los errores si el formulario está vacío', async () => {
    const { fixture, el, http } = crear();

    enviar(el);
    await fixture.whenStable();

    http.expectNone(URL_LOGIN);
    expect(el.textContent).toContain('Este campo es obligatorio.');
  });

  it('valida el formato del email', async () => {
    const { fixture, el } = crear();

    escribir(el, 'email', 'esto-no-es-un-email');
    (el.querySelector('#email') as HTMLInputElement).dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(el.textContent).toContain('Ingresa un email válido.');
  });

  it('envía el email normalizado y navega al inicio', async () => {
    const { fixture, el, http, navegar } = crear();

    escribir(el, 'email', ' Cliente@Mail.com ');
    escribir(el, 'contrasena', 'secreta123');
    enviar(el);
    const peticion = http.expectOne(URL_LOGIN);
    expect(peticion.request.body).toEqual({ email: 'cliente@mail.com', contrasena: 'secreta123' });
    peticion.flush({ token: 'a.b.c', nombre: 'Ana', rol: 'CLIENTE' });
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith('/');
    expect(localStorage.getItem('rol')).toBe('CLIENTE');
  });

  it('muestra un mensaje claro si las credenciales son incorrectas', async () => {
    const { fixture, el, http } = crear();

    escribir(el, 'email', 'ana@mail.com');
    escribir(el, 'contrasena', 'incorrecta');
    enviar(el);
    http.expectOne(URL_LOGIN).flush(null, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Email o contraseña incorrectos.');
  });

  it('lleva al personal al panel de administración', async () => {
    const { fixture, el, http, navegar } = crear();

    escribir(el, 'email', 'admin@puntoespresso.pe');
    escribir(el, 'contrasena', 'secreta123');
    enviar(el);
    http.expectOne(URL_LOGIN).flush({ token: 'a.b.c', nombre: 'Admin', rol: 'ADMIN' });
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith('/admin');
  });

  it('vuelve a la ruta pedida solo si es una ruta interna', async () => {
    const { fixture, el, http, navegar } = crear();
    fixture.componentRef.setInput('redirect', '/catalogo');
    escribir(el, 'email', 'ana@mail.com');
    escribir(el, 'contrasena', 'secreta123');
    enviar(el);
    http.expectOne(URL_LOGIN).flush({ token: 'a.b.c', nombre: 'Ana', rol: 'CLIENTE' });
    await fixture.whenStable();
    expect(navegar).toHaveBeenCalledWith('/catalogo');

    navegar.mockClear();
    fixture.componentRef.setInput('redirect', '//sitio-malicioso.com');
    enviar(el);
    http.expectOne(URL_LOGIN).flush({ token: 'a.b.c', nombre: 'Ana', rol: 'CLIENTE' });
    await fixture.whenStable();
    expect(navegar).toHaveBeenCalledWith('/');
  });
});