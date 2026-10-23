import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

const URL_ORDENES = `${environment.apiUrl}/api/admin/ordenes`;

function iniciarSesion(rol: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  localStorage.setItem('token', `cabecera.${btoa(JSON.stringify({ exp }))}.firma`);
  localStorage.setItem('nombre', 'Ana');
  localStorage.setItem('rol', rol);
}

describe('rutas protegidas', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear() {
    const harness = await RouterTestingHarness.create();
    const http = TestBed.inject(HttpTestingController);
    const url = () => TestBed.inject(Router).url;
    return { harness, http, url };
  }

  it('sin sesión, el panel manda al login recordando la ruta pedida', async () => {
    const { harness, url } = await crear();

    await harness.navigateByUrl('/admin');

    // /admin redirige a /admin/ordenes antes de revisar el acceso
    expect(url()).toBe('/login?redirect=%2Fadmin%2Fordenes');
  });

  it('un cliente no entra al panel', async () => {
    iniciarSesion('CLIENTE');
    const { harness, url } = await crear();

    await harness.navigateByUrl('/admin/ordenes');

    expect(url()).toBe('/');
  });

  it('el operador entra a las órdenes pero no a productos', async () => {
    iniciarSesion('OPERADOR');
    const { harness, http, url } = await crear();

    await harness.navigateByUrl('/admin/ordenes');
    http.expectOne((r) => r.url === URL_ORDENES).flush([]);
    expect(url()).toBe('/admin/ordenes');

    await harness.navigateByUrl('/admin/productos');
    expect(url()).toBe('/');
  });

  it('el administrador entra a todo y /admin lleva a las órdenes', async () => {
    iniciarSesion('ADMIN');
    const { harness, http, url } = await crear();

    await harness.navigateByUrl('/admin');
    http.expectOne((r) => r.url === URL_ORDENES).flush([]);
    expect(url()).toBe('/admin/ordenes');

    await harness.navigateByUrl('/admin/productos');
    expect(url()).toBe('/admin/productos');
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Productos');
  });
});