export type MetodoPago = 'CC' | 'DC';

export interface ItemPedido {
  idProducto: number;
  cantidad: number;
  instrucciones: string | null;
}

export interface PedidoRequest {
  items: ItemPedido[];
  idSede: number;
  metodoPago: MetodoPago;
}

export interface DetallePedido {
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PedidoResponse {
  codigoUnico: string;
  total: number;
  sedeNombre: string;
  detalles: DetallePedido[];
}