import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Privacy } from './privacy';
import { Terms } from './terms';

describe('Páginas legales', () => {
  async function crear(componente: Type<unknown>) {
    await TestBed.configureTestingModule({
      imports: [componente],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(componente);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const enlaces = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));

  it('la política de privacidad explica qué datos se recopilan, incluido Google', async () => {
    const el = await crear(Privacy);

    expect(el.querySelector('h1')?.textContent).toContain('Política de privacidad');
    expect(el.textContent).toContain('Si entras con Google');
    expect(el.textContent).toContain('Yape o Plin');
    expect(el.textContent).toContain('Ley N.° 29733');
  });

  it('la política de privacidad da un correo de contacto y enlaza a los términos', async () => {
    const el = await crear(Privacy);

    expect(enlaces(el)).toContain('mailto:contacto@puntoespresso.pe');
    expect(enlaces(el)).toContain('/terminos');
  });

  it('los términos explican pedidos y pagos con Yape o Plin', async () => {
    const el = await crear(Terms);

    expect(el.querySelector('h1')?.textContent).toContain('Términos y condiciones');
    expect(el.textContent).toContain('número de operación');
    expect(el.textContent).toContain('recogerlos en el local');
  });

  it('los términos enlazan a la política de privacidad', async () => {
    const el = await crear(Terms);

    expect(enlaces(el)).toContain('/privacidad');
  });
});