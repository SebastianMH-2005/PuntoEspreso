export type MetodoPago = 'CC' | 'DC' | 'YAPE' | 'PLIN';

export interface ItemPedido {
  idProducto: number;
  cantidad: number;
  instrucciones: string | null;
}

export interface PedidoRequest {
  items: ItemPedido[];
  idSede: number;
  metodoPago: MetodoPago;
  /** Solo en pagos con QR (Yape o Plin): número de operación del comprobante. */
  codigoOperacion?: string;
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