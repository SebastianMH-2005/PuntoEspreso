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

  private readonly _avisos = signal<string[]>([]);

  readonly items = this._items.asReadonly();
  /** Avisos de la última sincronización con el catálogo (producto agotado, cambio de precio...) */
  readonly avisos = this._avisos.asReadonly();
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

  /** Cambia la cantidad en +1 / -1. Devuelve false si no se pudo (mínimo 1, máximo el stock). */
  cambiarCantidad(idProducto: number, delta: number): boolean {
    const item = this._items().find((i) => i.idProducto === idProducto);
    const nueva = (item?.cantidad ?? 0) + delta;
    if (!item || nueva < 1 || nueva > item.stock) {
      return false;
    }
    this.guardar(this._items().map((i) => (i === item ? { ...i, cantidad: nueva } : i)));
    return true;
  }

  quitar(idProducto: number): void {
    this.guardar(this._items().filter((i) => i.idProducto !== idProducto));
  }

  actualizarInstrucciones(idProducto: number, texto: string): void {
    const instrucciones = texto.trim().slice(0, 200);
    this.guardar(
      this._items().map((i) => (i.idProducto === idProducto ? { ...i, instrucciones } : i)),
    );
  }

  /**
   * Compara el carrito con el catálogo actual: quita lo agotado y ajusta cantidades y precios.
   * Devuelve los avisos para el cliente y los deja también en `avisos`.
   */
  sincronizar(catalogo: Producto[]): string[] {
    const avisos: string[] = [];
    const vigentes: ItemCarrito[] = [];

    for (const item of this._items()) {
      const producto = catalogo.find((p) => p.idProducto === item.idProducto);
      if (!producto || producto.stock < 1) {
        avisos.push(`«${item.nombre}» ya no está disponible y se quitó de tu carrito.`);
        continue;
      }
      const cantidad = Math.min(item.cantidad, producto.stock);
      if (cantidad < item.cantidad) {
        avisos.push(
          `Ajustamos «${producto.nombre}» a ${cantidad} unidad(es) por el stock disponible.`,
        );
      }
      if (producto.precio !== item.precio) {
        avisos.push(`El precio de «${producto.nombre}» cambió a S/ ${producto.precio.toFixed(2)}.`);
      }
      vigentes.push({
        ...item,
        nombre: producto.nombre,
        precio: producto.precio,
        stock: producto.stock,
        imagen: producto.imagen,
        cantidad,
      });
    }

    this.guardar(vigentes);
    this._avisos.update((previos) => [...previos, ...avisos]);
    return avisos;
  }

  limpiarAvisos(): void {
    this._avisos.set([]);
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