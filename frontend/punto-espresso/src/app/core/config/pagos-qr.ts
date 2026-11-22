/** Un método de pago con código QR. */
export interface PagoQr {
  metodo: 'YAPE' | 'PLIN';
  nombre: string;
  titular: string;
  imagen: string;
}

/**
 * Métodos de pago con QR que se ofrecen en el checkout.
 *
 * Para activar uno nuevo (por ejemplo Plin): guarda su imagen en `public/img/qr-plin.jpg`
 * y quita los `//` de su línea. No hace falta cambiar nada más.
 */
export const PAGOS_QR: PagoQr[] = [
  {
    metodo: 'YAPE',
    nombre: 'Yape',
    titular: 'Sebastian Millones Huayta',
    imagen: '/img/qr-yape.jpg',
  },
  // PLIN (pendiente: aún no hay QR). Cuando lo tengas, descomenta estas líneas:
  // {
  //   metodo: 'PLIN',
  //   nombre: 'Plin',
  //   titular: 'Sebastian Millones Huayta',
  //   imagen: '/img/qr-plin.jpg',
  // },
];