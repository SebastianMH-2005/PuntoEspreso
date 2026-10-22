import { TestBed } from '@angular/core/testing';
import { Producto } from '../models/producto.models';
import { CartService } from './cart.service';

const latte: Producto = {
  idProducto: 1,
  categoria: null,
  nombre: 'Café Latte',
  precio: 12.5,
  descripcion: '',
  stock: 3,
  imagen: 'latte.jpg',
};

describe('CartService', () => {
  beforeEach(() => localStorage.clear());

  it('agrega productos y calcula unidades y total', () => {
    const cart = TestBed.inject(CartService);
    cart.agregar(latte, 2);
    cart.agregar({ ...latte, idProducto: 2, nombre: 'Frappé', precio: 15, stock: 10 }, 1);

    expect(cart.totalUnidades()).toBe(3);
    expect(cart.total()).toBe(40);
  });

  it('no supera el stock disponible', () => {
    const cart = TestBed.inject(CartService);

    expect(cart.agregar(latte, 5)).toBe(3);
    expect(cart.agregar(latte, 1)).toBe(0);
    expect(cart.cantidadDe(1)).toBe(3);
  });

  it('guarda el carrito y lo recupera al volver a crear el servicio', () => {
    TestBed.inject(CartService).agregar(latte, 2);
    TestBed.resetTestingModule();

    expect(TestBed.inject(CartService).cantidadDe(1)).toBe(2);
  });

  it('cambia la cantidad sin bajar de 1 ni pasar del stock', () => {
    const cart = TestBed.inject(CartService);
    cart.agregar(latte, 2);

    expect(cart.cambiarCantidad(1, 1)).toBe(true);
    expect(cart.cambiarCantidad(1, 1)).toBe(false); // el stock es 3
    expect(cart.cambiarCantidad(1, -1)).toBe(true);
    expect(cart.cambiarCantidad(1, -1)).toBe(true);
    expect(cart.cambiarCantidad(1, -1)).toBe(false); // mínimo 1
    expect(cart.cantidadDe(1)).toBe(1);
  });

  it('quita productos y guarda las instrucciones recortadas', () => {
    const cart = TestBed.inject(CartService);
    cart.agregar(latte, 1);
    cart.actualizarInstrucciones(1, '  sin azúcar  ');
    expect(cart.items()[0].instrucciones).toBe('sin azúcar');

    cart.quitar(1);
    expect(cart.items()).toEqual([]);
  });

  it('sincroniza con el catálogo: quita agotados y ajusta stock y precio', () => {
    const cart = TestBed.inject(CartService);
    cart.agregar(latte, 3);
    cart.agregar({ ...latte, idProducto: 2, nombre: 'Frappé', stock: 10 }, 1);

    const avisos = cart.sincronizar([{ ...latte, stock: 2, precio: 14 }]);

    expect(cart.items().map((i) => [i.idProducto, i.cantidad, i.precio])).toEqual([[1, 2, 14]]);
    expect(avisos).toHaveLength(3); // Frappé agotado, cantidad ajustada y precio nuevo
    expect(cart.avisos()).toEqual(avisos);

    cart.limpiarAvisos();
    expect(cart.avisos()).toEqual([]);
  });

  it('ignora datos dañados en el almacenamiento', () => {
    localStorage.setItem('carrito', '{esto no es json');
    expect(TestBed.inject(CartService).items()).toEqual([]);
  });
});