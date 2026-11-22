import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Producto } from '../../core/models/producto.models';
import { Carta } from './carta';

const URL_PRODUCTOS = `${environment.apiUrl}/api/productos`;
const bebidas = { idCategoria: 1, nombre: 'Bebidas' };
const granos = { idCategoria: 2, nombre: 'Café en Grano' };

const productos: Producto[] = [
  { idProducto: 1, categoria: bebidas, nombre: 'Frappé Mocha', precio: 14.5, descripcion: 'Con chocolate', stock: 3, imagen: 'a.jpg' },
  { idProducto: 2, categoria: bebidas, nombre: 'Café Americano', precio: 8.5, descripcion: 'Espresso largo', stock: 0, imagen: 'b.jpg' },
  { idProducto: 3, categoria: granos, nombre: 'Geisha 250g', precio: 45, descripcion: 'Café en grano', stock: 5, imagen: 'c.jpg' },
  { idProducto: 4, categoria: null, nombre: 'Galleta', precio: 4, descripcion: '', stock: 9, imagen: 'd.jpg' },
];

describe('Carta', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Carta],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  async function cargar(respuesta: Producto[] = productos) {
    const fixture = TestBed.createComponent(Carta);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_PRODUCTOS).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http };
  }

  const textos = (el: Element | undefined, selector: string) =>
    Array.from(el?.querySelectorAll(selector) ?? []).map((nodo) => nodo.textContent?.trim());

  it('agrupa por categoría, deja "Otros" al final y ordena los productos por nombre', async () => {
    const { el } = await cargar();

    expect(textos(el, '.seccion-titulo')).toEqual(['Bebidas', 'Café en Grano', 'Otros']);
    const primera = el.querySelectorAll('.seccion')[0];
    expect(textos(primera, '.nombre')).toEqual(['Café Americano', 'Frappé Mocha']);
  });

  it('muestra el precio de cada producto en soles', async () => {
    const { el } = await cargar();

    expect(textos(el, '.precio')).toContain('S/ 14.50');
    expect(textos(el, '.precio')).toContain('S/ 8.50');
    expect(textos(el, '.precio')).toContain('S/ 45.00');
  });

  it('marca como agotados los productos sin stock', async () => {
    const { el } = await cargar();

    expect(el.querySelectorAll('.item.agotado')).toHaveLength(1);
    expect(el.querySelector('.item.agotado')?.textContent).toContain('Café Americano');
    expect(el.querySelector('.item.agotado')?.textContent).toContain('Agotado');
  });

  it('ofrece hacer el pedido desde la carta', async () => {
    const { el } = await cargar();
    const enlaces = Array.from(el.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(enlaces).toContain('/catalogo');
  });

  it('imprime la carta con el botón Imprimir', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const { el } = await cargar();

    const boton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Imprimir carta'),
    ) as HTMLButtonElement;
    boton.click();

    expect(imprimir).toHaveBeenCalled();
  });

  it('avisa si no hay productos publicados', async () => {
    const { el } = await cargar([]);

    expect(el.textContent).toContain('Pronto publicaremos nuestra carta');
  });

  it('muestra un error y permite reintentar', async () => {
    const fixture = TestBed.createComponent(Carta);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_PRODUCTOS).flush('error', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No pudimos cargar la carta');

    (el.querySelector('.alert button') as HTMLButtonElement).click();
    http.expectOne(URL_PRODUCTOS).flush(productos);
    await fixture.whenStable();

    expect(textos(el, '.seccion-titulo')).toContain('Bebidas');
  });
});