import { computed, Injectable, signal } from '@angular/core';
import { Producto } from '../models/producto.models';

export interface ItemCarrito {
  idProducto: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen: string;
  cantidad: number;
  instrucciones?: string;
}

const CLAVE_CARRITO = 'carrito';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<ItemCarrito[]>(this.leer());

  readonly items = this._items.asReadonly();
  readonly totalUnidades = computed(() => this._items().reduce((suma, i) => suma + i.cantidad, 0));
  readonly total = computed(
    () =>
      Math.round(this._items().reduce((suma, i) => suma + i.precio * i.cantidad, 0) * 100) / 100,
  );

  cantidadDe(idProducto: number): number {
    return this._items().find((i) => i.idProducto === idProducto)?.cantidad ?? 0;
  }

  /** Agrega unidades sin superar el stock. Devuelve cuántas se agregaron realmente. */
  agregar(producto: Producto, cantidad = 1): number {
    const existente = this._items().find((i) => i.idProducto === producto.idProducto);
    const agregadas = Math.min(cantidad, producto.stock - (existente?.cantidad ?? 0));
    if (agregadas <= 0) {
      return 0;
    }

    const actualizado: ItemCarrito = {
      ...existente,
      idProducto: producto.idProducto,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen,
      cantidad: (existente?.cantidad ?? 0) + agregadas,
    };
    this.guardar(
      existente
        ? this._items().map((i) => (i === existente ? actualizado : i))
        : [...this._items(), actualizado],
    );
    return agregadas;
  }

  vaciar(): void {
    this.guardar([]);
  }

  private guardar(items: ItemCarrito[]): void {
    this._items.set(items);
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    } catch {
      // Sin espacio o navegación privada: el carrito sigue funcionando en memoria
    }
  }

  private leer(): ItemCarrito[] {
    try {
      const datos: unknown = JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? '[]');
      return Array.isArray(datos)
        ? datos.filter(
            (i): i is ItemCarrito =>
              typeof i?.idProducto === 'number' &&
              typeof i?.cantidad === 'number' &&
              i.cantidad > 0,
          )
        : [];
    } catch {
      return [];
    }
  }
}