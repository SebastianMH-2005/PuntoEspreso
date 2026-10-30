import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Carousel, Diapositiva } from './carousel';

const diapositivas: Diapositiva[] = [
  { imagen: '/img/a.jpg', alt: 'Primera', enlace: '/catalogo' },
  { imagen: '/img/b.jpg', alt: 'Segunda', enlace: '/catalogo' },
  { imagen: '/img/c.jpg', alt: 'Tercera', enlace: '/catalogo' },
];

describe('Carousel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Carousel], providers: [provideRouter([])] });
  });

  async function crear(lista: Diapositiva[] = diapositivas) {
    const fixture = TestBed.createComponent(Carousel);
    fixture.componentRef.setInput('diapositivas', lista);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const activa = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.carousel-item')).findIndex((item) =>
      item.classList.contains('active'),
    );
  const control = (el: HTMLElement, clase: string) =>
    el.querySelector(`.${clase}`) as HTMLButtonElement;

  it('muestra solo la primera diapositiva al empezar', async () => {
    const { el } = await crear();

    expect(el.querySelectorAll('.carousel-item')).toHaveLength(3);
    expect(activa(el)).toBe(0);
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('Primera');
  });

  it('avanza y retrocede dando la vuelta en los extremos', async () => {
    const { fixture, el } = await crear();

    control(el, 'carousel-control-prev').click();
    await fixture.whenStable();
    expect(activa(el)).toBe(2);

    control(el, 'carousel-control-next').click();
    await fixture.whenStable();
    expect(activa(el)).toBe(0);
  });

  it('salta a la diapositiva elegida con los indicadores', async () => {
    const { fixture, el } = await crear();

    (el.querySelectorAll('.carousel-indicators button')[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(activa(el)).toBe(1);
  });

  it('avanza sola y se detiene mientras el cursor está encima', async () => {
    const intervalo = vi.spyOn(globalThis, 'setInterval');
    const { fixture, el } = await crear();
    const [avanzar] = intervalo.mock.calls.find((llamada) => llamada[1] === 6000) ?? [];

    (avanzar as () => void)();
    await fixture.whenStable();
    expect(activa(el)).toBe(1);

    el.querySelector('section')?.dispatchEvent(new Event('mouseenter'));
    (avanzar as () => void)();
    await fixture.whenStable();
    expect(activa(el)).toBe(1);

    el.querySelector('section')?.dispatchEvent(new Event('mouseleave'));
    (avanzar as () => void)();
    await fixture.whenStable();
    expect(activa(el)).toBe(2);
  });

  it('con una sola diapositiva no muestra controles', async () => {
    const { el } = await crear([diapositivas[0]]);

    expect(el.querySelector('.carousel-control-next')).toBeNull();
    expect(el.querySelector('.carousel-indicators')).toBeNull();
  });

  it('no dibuja nada si no hay diapositivas', async () => {
    const { el } = await crear([]);
    expect(el.querySelector('section')).toBeNull();
  });
});