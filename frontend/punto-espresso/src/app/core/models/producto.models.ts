export interface Categoria {
  idCategoria: number;
  nombre: string;
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