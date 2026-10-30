import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { About } from './about';

describe('About', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [About], providers: [provideRouter([])] });
  });

  async function crear() {
    const fixture = TestBed.createComponent(About);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('cuenta la historia y el proceso del negocio', async () => {
    const el = await crear();

    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.textContent).toContain('¿Cómo nació Punto Espresso?');
    expect(el.textContent).toContain('Tostado Artesanal de Origen');
    expect(el.textContent).toContain('Cultura Barista');
  });

  it('muestra los tres compromisos', async () => {
    const el = await crear();

    ['Pasión', 'Calidad', 'Comunidad'].forEach((titulo) =>
      expect(el.textContent).toContain(titulo),
    );
  });

  it('invita a ver el catálogo y sus imágenes tienen texto alternativo', async () => {
    const el = await crear();

    expect(el.querySelector('a[href="/catalogo"]')?.textContent).toContain('Ver Especialidades');
    const sinAlt = Array.from(el.querySelectorAll('img')).filter((img) => !img.getAttribute('alt'));
    expect(sinAlt).toHaveLength(0);
  });
});