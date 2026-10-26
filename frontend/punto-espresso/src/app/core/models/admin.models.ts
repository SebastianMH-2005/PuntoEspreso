import { Rol } from './auth.models';
import { DetallePedido, EstadoPedido, MetodoPago } from './pedido.models';

export interface VentaDia {
  fecha: string; // "2026-10-24"
  pedidos: number;
  total: number;
}

export interface ProductoVendido {
  nombre: string;
  unidades: number;
  ingresos: number;
}

export interface ProductoStockBajo {
  idProducto: number;
  nombre: string;
  stock: number;
}

export interface Dashboard {
  dias: number;
  pedidosHoy: number;
  ventasHoy: number;
  pedidosPeriodo: number;
  ventasPeriodo: number;
  ticketPromedio: number;
  canceladosPeriodo: number;
  pendientes: number;
  enProceso: number;
  listos: number;
  ventasPorDia: VentaDia[];
  masVendidos: ProductoVendido[];
  stockBajo: ProductoStockBajo[];
}

export interface UsuarioSistema {
  idUsuarioSistema: number;
  nombre: string;
  email: string;
  rol: Rol;
}

/** Datos para crear un operador; el backend le asigna el rol OPERADOR. */
export interface OperadorRequest {
  nombre: string;
  email: string;
  contrasena: string;
}

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