import { DetallePedido, EstadoPedido, MetodoPago } from './pedido.models';

export interface OrdenAdmin {
  idOrden: number;
  clienteNombre: string;
  clienteEmail: string;
  tipoEntrega: string;
  metodoPago: MetodoPago;
  estado: EstadoPedido;
  codigoUnico: string;
  total: number;
  fechaCreacion: string | null;
  sedeNombre: string | null;
  detalles: DetallePedido[];
}