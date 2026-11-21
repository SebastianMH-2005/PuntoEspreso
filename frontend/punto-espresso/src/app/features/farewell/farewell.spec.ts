import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { Farewell } from './farewell';

describe('Farewell', () => {
  afterEach(() => vi.restoreAllMocks());

  async function crear(nombre?: string) {
    await TestBed.configureTestingModule({
      imports: [Farewell],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Farewell);
    if (nombre !== undefined) {
      fixture.componentRef.setInput('nombre', nombre);
    }
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('saluda por el nombre que llega en la URL', async () => {
    const { el } = await crear('Ana');

    expect(el.querySelector('h1')?.textContent).toContain('¡Hasta pronto, Ana!');
  });

  it('usa un saludo general si no hay nombre', async () => {
    const { el } = await crear();
    const titulo = el.querySelector('h1')?.textContent ?? '';

    expect(titulo).toContain('¡Hasta pronto!');
    expect(titulo).not.toContain('undefined');
  });

  it('recorta los nombres larguísimos', async () => {
    const { el } = await crear('A'.repeat(80));
    const titulo = el.querySelector('h1')?.textContent ?? '';

    expect(titulo).toContain('A'.repeat(30) + '!');
    expect(titulo).not.toContain('A'.repeat(31));
  });

  it('ofrece volver al inicio o ir al catálogo', async () => {
    const { el } = await crear('Ana');
    const enlaces = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(enlaces).toContain('/');
    expect(enlaces).toContain('/catalogo');
  });

  it('vuelve al inicio solo a los 8 segundos', async () => {
    const programar = vi.spyOn(globalThis, 'setTimeout');
    await crear('Ana');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    const llamada = programar.mock.calls.find((c) => c[1] === 8000);
    expect(llamada).toBeDefined();
    (llamada![0] as () => void)();

    expect(navegar).toHaveBeenCalledWith('/');
  });
});