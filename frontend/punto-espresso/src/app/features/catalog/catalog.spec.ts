import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Producto } from '../../core/models/producto.models';
import { Catalog } from './catalog';

const bebidas = { idCategoria: 1, nombre: 'Bebidas' };
const granos = { idCategoria: 2, nombre: 'Café en Grano' };
const productos: Producto[] = [
  {
    idProducto: 1,
    categoria: bebidas,
    nombre: 'Café Latte',
    precio: 12.5,
    descripcion: 'Espresso con leche',
    stock: 5,
    imagen: 'latte.jpg',
  },
  {
    idProducto: 2,
    categoria: bebidas,
    nombre: 'Frappé Mocha',
    precio: 15,
    descripcion: 'Frío con chocolate',
    stock: 3,
    imagen: 'mocha.jpg',
  },
  {
    idProducto: 3,
    categoria: granos,
    nombre: 'Geisha 250g',
    precio: 45,
    descripcion: 'Café en grano de origen',
    stock: 0,
    imagen: 'geisha.jpg',
  },
];

describe('Catalog', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Catalog],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function cargar() {
    const fixture = TestBed.createComponent(Catalog);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/api/productos`).flush(productos);
    http.expectOne(`${environment.apiUrl}/api/categorias`).flush([bebidas, granos]);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http };
  }

  const tarjetas = (el: HTMLElement) => el.querySelectorAll('app-product-card').length;

  it('muestra las tarjetas al cargar los productos', async () => {
    const { el } = await cargar();
    expect(tarjetas(el)).toBe(3);
  });

  it('filtra por categoría', async () => {
    const { fixture, el } = await cargar();
    const boton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Café en Grano'),
    );

    boton?.click();
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(1);
    expect(el.textContent).toContain('Geisha 250g');
  });

  it('busca sin importar tildes ni mayúsculas', async () => {
    const { fixture, el } = await cargar();
    const caja = el.querySelector('input[type="search"]') as HTMLInputElement;

    caja.value = 'CAFE';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(2); // "Café Latte" y "Geisha" (descripción: café en grano)
  });

  it('muestra un aviso si no hay resultados', async () => {
    const { fixture, el } = await cargar();
    const caja = el.querySelector('input[type="search"]') as HTMLInputElement;

    caja.value = 'pizza';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(el.textContent).toContain('No encontramos productos');
  });

  it('agrega al carrito y avisa al visitante', async () => {
    const { fixture, el } = await cargar();

    (el.querySelector('app-product-card button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(el.textContent).toContain('se agregó al carrito');
    expect(JSON.parse(localStorage.getItem('carrito') ?? '[]')).toHaveLength(1);
  });

  it('muestra el error y permite reintentar', async () => {
    const fixture = TestBed.createComponent(Catalog);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne(`${environment.apiUrl}/api/productos`)
      .flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No pudimos cargar el catálogo');

    (el.querySelector('.alert-danger button') as HTMLButtonElement).click();
    http.expectOne(`${environment.apiUrl}/api/productos`).flush(productos);
    // La petición de categorías del primer intento quedó cancelada: se responde solo la nueva
    http
      .match(`${environment.apiUrl}/api/categorias`)
      .filter((peticion) => !peticion.cancelled)[0]
      .flush([bebidas, granos]);
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(3);
  });
});