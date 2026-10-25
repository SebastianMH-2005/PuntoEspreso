import { Rol } from './auth.models';
import { DetallePedido, EstadoPedido, MetodoPago } from './pedido.models';

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