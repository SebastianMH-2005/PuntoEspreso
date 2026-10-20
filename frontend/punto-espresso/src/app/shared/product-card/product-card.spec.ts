import { TestBed } from '@angular/core/testing';
import { Producto } from '../../core/models/producto.models';
import { ProductCard } from './product-card';

const producto: Producto = {
  idProducto: 1,
  categoria: { idCategoria: 1, nombre: 'Bebidas' },
  nombre: 'Café Latte',
  precio: 12.5,
  descripcion: 'Espresso con leche',
  stock: 5,
  imagen: 'cafe-latte.jpg',
};

describe('ProductCard', () => {
  async function crear(datos: Partial<Producto> = {}, enCarrito = 0) {
    await TestBed.configureTestingModule({ imports: [ProductCard] }).compileComponents();
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('producto', { ...producto, ...datos });
    fixture.componentRef.setInput('enCarrito', enCarrito);
    await fixture.whenStable();
    return fixture;
  }

  it('muestra nombre, precio y stock', async () => {
    const fixture = await crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Café Latte');
    expect(texto).toContain('S/ 12.50');
    expect(texto).toContain('5 disponibles');
  });

  it('emite el producto al pulsar el botón', async () => {
    const fixture = await crear();
    let emitido: Producto | undefined;
    fixture.componentInstance.agregar.subscribe((p) => (emitido = p));

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();

    expect(emitido?.idProducto).toBe(1);
  });

  it('deshabilita el botón si no hay stock', async () => {
    const fixture = await crear({ stock: 0 });
    const boton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(boton?.disabled).toBe(true);
    expect(boton?.textContent).toContain('Agotado');
  });

  it('deshabilita el botón si todo el stock ya está en el carrito', async () => {
    const fixture = await crear({ stock: 2 }, 2);
    const boton = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(boton?.disabled).toBe(true);
  });
});