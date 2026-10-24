import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Producto } from '../../../core/models/producto.models';
import { AdminProducts } from './admin-products';

const URL_PRODUCTOS = `${environment.apiUrl}/api/admin/productos`;
const URL_CATEGORIAS = `${environment.apiUrl}/api/categorias`;

const bebidas = { idCategoria: 1, nombre: 'Bebidas' };
const granos = { idCategoria: 2, nombre: 'Café en Grano' };
const producto = (datos: Partial<Producto>): Producto => ({
  idProducto: 1,
  categoria: bebidas,
  nombre: 'Café Latte',
  precio: 12.5,
  descripcion: 'Espresso con leche',
  stock: 10,
  imagen: 'latte.jpg',
  ...datos,
});
const lista = [
  producto({ idProducto: 1 }),
  producto({ idProducto: 2, nombre: 'Frappé Mocha', descripcion: 'Frío con chocolate', stock: 3 }),
  producto({ idProducto: 3, nombre: 'Geisha 250g', categoria: granos, stock: 0, precio: 45 }),
  producto({ idProducto: 4, nombre: 'Grano Caturra', categoria: granos, stock: 20, precio: 30 }),
];

describe('AdminProducts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminProducts],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function montar(aviso?: string) {
    const fixture = TestBed.createComponent(AdminProducts);
    if (aviso) {
      fixture.componentRef.setInput('aviso', aviso);
    }
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
    };
  }

  async function crear(aviso?: string) {
    const { fixture, el, http } = montar(aviso);
    http.expectOne(URL_PRODUCTOS).flush(lista);
    http.expectOne(URL_CATEGORIAS).flush([bebidas, granos]);
    await fixture.whenStable();
    return { fixture, el, http };
  }

  const filas = (el: HTMLElement) => el.querySelectorAll('tbody tr');
  const boton = (el: HTMLElement | Element, texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(texto));

  it('lista los productos con categoría, precio y estado del stock', async () => {
    const { el } = await crear();

    expect(filas(el)).toHaveLength(4);
    expect(el.textContent).toContain('Café Latte');
    expect(el.textContent).toContain('Bebidas');
    expect(el.textContent).toContain('S/ 45.00');
    expect(el.textContent).toContain('Agotado');
    expect(el.textContent).toContain('3 · bajo');
  });

  it('filtra por categoría', async () => {
    const { fixture, el } = await crear();
    const selector = el.querySelector('select') as HTMLSelectElement;

    selector.value = '2';
    selector.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(2);
    expect(el.textContent).toContain('Geisha 250g');
  });

  it('muestra solo los productos con stock bajo', async () => {
    const { fixture, el } = await crear();
    const casilla = el.querySelector('#soloStockBajo') as HTMLInputElement;

    casilla.click();
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(2); // Frappé (3) y Geisha (0)
  });

  it('busca sin importar tildes ni mayúsculas', async () => {
    const { fixture, el } = await crear();
    const caja = el.querySelector('input[type="search"]') as HTMLInputElement;

    caja.value = 'FRAPPE';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(1);
  });

  it('elimina un producto después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(filas(el)[0], 'Eliminar')?.click();
    const peticion = http.expectOne(`${URL_PRODUCTOS}/1`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(3);
    expect(el.textContent).toContain('«Café Latte» se eliminó.');
  });

  it('no elimina nada si el administrador no confirma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { el, http } = await crear();

    boton(filas(el)[0], 'Eliminar')?.click();

    http.expectNone(`${URL_PRODUCTOS}/1`);
  });

  it('explica qué hacer si el producto ya tiene pedidos', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(filas(el)[0], 'Eliminar')?.click();
    http
      .expectOne(`${URL_PRODUCTOS}/1`)
      .flush(
        { message: 'No se puede completar la operación: el registro está en uso o está duplicado' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(4);
    expect(el.textContent).toContain('el registro está en uso');
    expect(el.textContent).toContain('ponle stock 0');
  });

  it('muestra el aviso de que el producto se creó o actualizó', async () => {
    const { el } = await crear('creado');
    expect(el.textContent).toContain('Producto creado.');
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const { fixture, el, http } = montar();
    http.expectOne(URL_PRODUCTOS).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(el.textContent).toContain('No pudimos cargar los productos');

    boton(el, 'Reintentar')?.click();
    http.expectOne(URL_PRODUCTOS).flush(lista);
    // La petición de categorías del primer intento quedó cancelada: se responde solo la nueva
    http
      .match(URL_CATEGORIAS)
      .filter((peticion) => !peticion.cancelled)[0]
      .flush([bebidas, granos]);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(4);
  });
});