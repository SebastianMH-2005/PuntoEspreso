export interface Categoria {
  idCategoria: number;
  nombre: string;
}

/** Datos que el administrador envía para crear o editar un producto. */
export interface ProductoRequest {
  idCategoria: number;
  nombre: string;
  precio: number;
  descripcion: string;
  stock: number;
  imagen: string;
}

export interface Producto {
  idProducto: number;
  categoria: Categoria | null;
  nombre: string;
  precio: number;
  descripcion: string;
  stock: number;
  imagen: string;
}