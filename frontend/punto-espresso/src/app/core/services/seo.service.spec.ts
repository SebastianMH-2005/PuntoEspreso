import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SeoService } from './seo.service';

@Component({ template: '' })
class Pagina {}

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class Contenedor {}

describe('SeoService', () => {
  const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');
  const descripcion = () =>
    document.head.querySelector('meta[name="description"]')?.getAttribute('content');

  let harness: RouterTestingHarness;
  const navegar = (url: string) => harness.navigateByUrl(url);

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: '', pathMatch: 'full', component: Pagina },
          {
            path: 'catalogo',
            component: Pagina,
            data: { descripcion: 'Descripción del catálogo' },
          },
          {
            path: 'admin',
            component: Contenedor,
            data: { noindex: true },
            children: [{ path: 'ordenes', component: Pagina }],
          },
        ]),
      ],
    });
    TestBed.inject(SeoService);
    harness = await RouterTestingHarness.create();
  });

  it('usa la descripción de la ruta y permite indexar las páginas públicas', async () => {
    await navegar('/catalogo');

    expect(descripcion()).toBe('Descripción del catálogo');
    expect(robots()).toBe('index, follow, max-image-preview:large');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(
      /\/catalogo$/,
    );
  });

  it('el noindex de la ruta padre también vale para sus rutas hijas', async () => {
    await navegar('/admin/ordenes');

    expect(robots()).toBe('noindex, nofollow');
  });

  it('vuelve a permitir indexar al salir de una página privada', async () => {
    await navegar('/admin/ordenes');
    await navegar('/catalogo');

    expect(robots()).toBe('index, follow, max-image-preview:large');
  });
});