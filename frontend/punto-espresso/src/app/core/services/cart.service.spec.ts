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

  it('ignora datos dañados en el almacenamiento', () => {
    localStorage.setItem('carrito', '{esto no es json');
    expect(TestBed.inject(CartService).items()).toEqual([]);
  });
});