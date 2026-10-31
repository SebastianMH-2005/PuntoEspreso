import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App completa (con las rutas reales)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  async function abrir(url: string) {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('el inicio muestra el encabezado, el contenido y el pie de página', async () => {
    const el = await abrir('/');

    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('main h1')?.textContent).toContain('Punto Espresso');
    expect(el.querySelector('app-footer')).not.toBeNull();
  });

  it('nosotros muestra su contenido', async () => {
    expect((await abrir('/nosotros')).querySelector('main h1')?.textContent).toContain('Sobre');
  });

  it('una ruta inexistente muestra la página 404', async () => {
    expect((await abrir('/no-existe')).querySelector('main')?.textContent).toContain('404');
  });
});