import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { Producto } from '../../core/models/producto.models';
import { Sede } from '../../core/models/sede.models';
import { Checkout } from './checkout';

const URL_SEDES = `${environment.apiUrl}/api/sedes`;
const URL_PRODUCTOS = `${environment.apiUrl}/api/productos`;
const URL_PEDIDOS = `${environment.apiUrl}/api/pedidos`;

const sedes: Sede[] = [
  {
    idSede: 1,
    nombre: 'La Marina',
    direccion: 'Av. de la Marina 2500',
    horarioDias: 'Lunes a Domingo',
    horarioHoras: '10:30 - 21:00',
  },
  {
    idSede: 2,
    nombre: 'San Isidro',
    direccion: 'Av. Paseo de la República 3440',
    horarioDias: 'Lunes a Domingo',
    horarioHoras: '08:00 - 21:30',
  },
];
const latte: Producto = {
  idProducto: 1,
  categoria: null,
  nombre: 'Café Latte',
  precio: 12.5,
  descripcion: '',
  stock: 5,
  imagen: 'a.jpg',
};

// Un vencimiento válido: siempre dentro de dos años
const anioFuturo = String((new Date().getFullYear() + 2) % 100).padStart(2, '0');

function guardarCarrito(instrucciones?: string) {
  localStorage.setItem(
    'carrito',
    JSON.stringify([
      {
        idProducto: 1,
        nombre: 'Café Latte',
        precio: 12.5,
        stock: 5,
        imagen: 'a.jpg',
        cantidad: 2,
        instrucciones,
      },
    ]),
  );
}

describe('Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(catalogo: Producto[] = [latte]) {
    const fixture = TestBed.createComponent(Checkout);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_SEDES).flush(sedes);
    http.expectOne(URL_PRODUCTOS).flush(catalogo);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http, navegar };
  }

  function escribir(el: HTMLElement, id: string, valor: string) {
    const campo = el.querySelector(`#${id}`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function completarTarjeta(el: HTMLElement, cambios: Record<string, string> = {}) {
    const datos: Record<string, string> = {
      titular: 'ANA PEREZ',
      numeroTarjeta: '4111111111111111',
      vencimiento: `12${anioFuturo}`,
      cvv: '123',
      ...cambios,
    };
    Object.entries(datos).forEach(([id, valor]) => escribir(el, id, valor));
  }

  const confirmar = (el: HTMLElement) =>
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

  it('vuelve al carrito si está vacío, sin pedir nada al servidor', async () => {
    const fixture = TestBed.createComponent(Checkout);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectNone(URL_SEDES);
    expect(navegar).toHaveBeenCalledWith('/carrito');
  });

  it('muestra las sedes y deja la primera elegida', async () => {
    guardarCarrito();
    const { el } = await crear();

    const opciones = Array.from(el.querySelectorAll('#idSede option')).map((o) => o.textContent);
    expect(opciones).toHaveLength(2);
    expect(opciones[0]).toContain('La Marina');
    expect((el.querySelector('#idSede') as HTMLSelectElement).selectedIndex).toBe(0);
  });

  it('vuelve al carrito con el aviso si cambió el precio', async () => {
    guardarCarrito();
    const { navegar } = await crear([{ ...latte, precio: 14 }]);

    expect(navegar).toHaveBeenCalledWith('/carrito');
  });

  it('valida los datos de la tarjeta y no envía el pedido', async () => {
    guardarCarrito();
    const { fixture, el, http } = await crear();

    completarTarjeta(el, { numeroTarjeta: '4111', vencimiento: '0120', cvv: '12' });
    confirmar(el);
    await fixture.whenStable();

    http.expectNone(URL_PEDIDOS);
    expect(el.textContent).toContain('Debe tener 16 dígitos.');
    expect(el.textContent).toContain('La tarjeta está vencida.');
    expect(el.textContent).toContain('Debe tener 3 dígitos.');
  });

  it('solo deja escribir dígitos y da formato MM/AA al vencimiento', async () => {
    guardarCarrito();
    const { el } = await crear();

    escribir(el, 'numeroTarjeta', '4111-1111 abcd');
    escribir(el, 'vencimiento', '1230');

    expect((el.querySelector('#numeroTarjeta') as HTMLInputElement).value).toBe('41111111');
    expect((el.querySelector('#vencimiento') as HTMLInputElement).value).toBe('12/30');
  });

  it('envía el pedido sin los datos de la tarjeta, vacía el carrito y muestra el código', async () => {
    guardarCarrito('sin azúcar');
    const { fixture, el, http } = await crear();

    completarTarjeta(el);
    confirmar(el);
    const peticion = http.expectOne(URL_PEDIDOS);
    expect(peticion.request.body).toEqual({
      idSede: 1,
      metodoPago: 'CC',
      items: [{ idProducto: 1, cantidad: 2, instrucciones: 'sin azúcar' }],
    });
    peticion.flush({
      codigoUnico: 'PE-AB12CD34',
      total: 25,
      sedeNombre: 'La Marina',
      detalles: [{ productoNombre: 'Café Latte', cantidad: 2, precioUnitario: 12.5 }],
    });
    await fixture.whenStable();

    expect(el.textContent).toContain('PE-AB12CD34');
    expect(el.textContent).toContain('La Marina');
    expect(JSON.parse(localStorage.getItem('carrito') ?? 'null')).toEqual([]);
  });

  it('muestra el error de stock del servidor y conserva el carrito', async () => {
    guardarCarrito();
    const { fixture, el, http } = await crear();

    completarTarjeta(el);
    confirmar(el);
    http
      .expectOne(URL_PEDIDOS)
      .flush('No hay suficiente stock de «Café Latte»', { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(el.textContent).toContain('No hay suficiente stock de «Café Latte»');
    expect(el.textContent).toContain('Revisar mi carrito');
    expect(JSON.parse(localStorage.getItem('carrito') ?? '[]')).toHaveLength(1);
  });
});