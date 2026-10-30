import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Home], providers: [provideRouter([])] });
  });

  async function crear() {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('tiene un único título principal con el nombre del negocio', async () => {
    const el = await crear();
    const titulos = el.querySelectorAll('h1');

    expect(titulos).toHaveLength(1);
    expect(titulos[0].textContent).toContain('Punto Espresso');
  });

  it('lleva al catálogo desde los botones principales', async () => {
    const el = await crear();
    const enlaces = Array.from(el.querySelectorAll('a[href="/catalogo"]')).map((a) =>
      a.textContent?.trim(),
    );

    expect(enlaces).toContain('Explorar el Catálogo');
    expect(enlaces).toContain('Ver Bebidas');
    expect(enlaces).toContain('Ver Café en Grano');
  });

  it('muestra el carrusel con las tres imágenes destacadas', async () => {
    const el = await crear();
    expect(el.querySelectorAll('app-carousel .carousel-item')).toHaveLength(3);
  });

  it('todas las imágenes tienen texto alternativo', async () => {
    const el = await crear();
    const sinAlt = Array.from(el.querySelectorAll('img')).filter((img) => !img.getAttribute('alt'));
    expect(sinAlt).toHaveLength(0);
  });
});