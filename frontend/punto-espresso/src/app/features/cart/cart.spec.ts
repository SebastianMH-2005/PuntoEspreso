import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Producto } from '../../core/models/producto.models';
import { Cart } from './cart';

const URL_PRODUCTOS = `${environment.apiUrl}/api/productos`;
const catalogo: Producto[] = [
  {
    idProducto: 1,
    categoria: null,
    nombre: 'Café Latte',
    precio: 12.5,
    descripcion: '',
    stock: 5,
    imagen: 'a.jpg',
  },
  {
    idProducto: 2,
    categoria: null,
    nombre: 'Frappé Mocha',
    precio: 15,
    descripcion: '',
    stock: 3,
    imagen: 'b.jpg',
  },
];

function guardarCarrito(items: object[]) {
  localStorage.setItem('carrito', JSON.stringify(items));
}
const item = (p: Producto, cantidad: number) => ({
  idProducto: p.idProducto,
  nombre: p.nombre,
  precio: p.precio,
  stock: p.stock,
  imagen: p.imagen,
  cantidad,
});

describe('Cart', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Cart],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(respuesta: Producto[] = catalogo) {
    const fixture = TestBed.createComponent(Cart);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_PRODUCTOS).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const boton = (el: HTMLElement, etiqueta: string) =>
    el.querySelector(`button[aria-label="${etiqueta}"]`) as HTMLButtonElement;

  it('muestra el carrito vacío sin pedir nada al servidor', async () => {
    const fixture = TestBed.createComponent(Cart);
    fixture.detectChanges();
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectNone(URL_PRODUCTOS);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tu carrito está vacío');
  });

  it('lista los productos con su total', async () => {
    guardarCarrito([item(catalogo[0], 2), item(catalogo[1], 1)]);
    const { el } = await crear();

    expect(el.textContent).toContain('Café Latte');
    expect(el.textContent).toContain('Frappé Mocha');
    expect(el.textContent).toContain('S/ 40.00');
  });

  it('cambia la cantidad y quita productos', async () => {
    guardarCarrito([item(catalogo[0], 2)]);
    const { fixture, el } = await crear();

    boton(el, 'Aumentar cantidad').click();
    await fixture.whenStable();
    expect(el.textContent).toContain('S/ 37.50');

    boton(el, 'Quitar Café Latte').click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Tu carrito está vacío');
  });

  it('avisa al llegar al límite de stock', async () => {
    guardarCarrito([item(catalogo[1], 3)]);
    const { fixture, el } = await crear();

    boton(el, 'Aumentar cantidad').click();
    await fixture.whenStable();

    expect(el.textContent).toContain('Solo hay 3 unidades disponibles');
  });

  it('avisa si cambió el precio o el stock desde que se agregó', async () => {
    guardarCarrito([item(catalogo[0], 4)]);
    const { el } = await crear([{ ...catalogo[0], precio: 14, stock: 2 }]);

    expect(el.textContent).toContain('Ajustamos «Café Latte» a 2 unidad(es)');
    expect(el.textContent).toContain('El precio de «Café Latte» cambió a S/ 14.00');
  });
});