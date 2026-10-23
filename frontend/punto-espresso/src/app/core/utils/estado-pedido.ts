import { EstadoPedido } from '../models/pedido.models';

export const ESTADOS_PEDIDO: Record<EstadoPedido, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'bg-warning text-dark' },
  EN_PROCESO: { texto: 'En proceso', clase: 'bg-info text-dark' },
  LISTO: { texto: 'Listo para recoger', clase: 'bg-success' },
  ENTREGADO: { texto: 'Entregado', clase: 'bg-secondary' },
  CANCELADO: { texto: 'Cancelado', clase: 'bg-danger' },
};

/** Pedidos que todavía están en marcha (los demás ya terminaron). */
export const ESTADOS_ACTIVOS: EstadoPedido[] = ['PENDIENTE', 'EN_PROCESO', 'LISTO'];

export const TODOS_LOS_ESTADOS: EstadoPedido[] = [
  'PENDIENTE',
  'EN_PROCESO',
  'LISTO',
  'ENTREGADO',
  'CANCELADO',
];