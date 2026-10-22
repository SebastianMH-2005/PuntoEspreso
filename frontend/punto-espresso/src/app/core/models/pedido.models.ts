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

export type EstadoPedido = 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO' | 'CANCELADO';

export interface MiPedido {
  idOrden: number;
  codigoUnico: string;
  estado: EstadoPedido;
  tipoEntrega: string;
  metodoPago: MetodoPago;
  total: number;
  fechaCreacion: string | null;
  sedeNombre: string | null;
  detalles: DetallePedido[];
}

export interface PedidoResponse {
  codigoUnico: string;
  total: number;
  sedeNombre: string;
  detalles: DetallePedido[];
}