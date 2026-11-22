import { MetodoPago } from '../models/pedido.models';

const ETIQUETAS: Record<MetodoPago, string> = {
  CC: 'Tarjeta de crédito',
  DC: 'Tarjeta de débito',
  YAPE: 'Yape',
  PLIN: 'Plin',
};

/** Nombre legible de un método de pago, para mostrarlo en pantalla. */
export function etiquetaMetodoPago(metodo: MetodoPago): string {
  return ETIQUETAS[metodo] ?? metodo;
}