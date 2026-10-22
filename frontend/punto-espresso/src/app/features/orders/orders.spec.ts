import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { MiPedido } from '../../core/models/pedido.models';
import { Orders } from './orders';

const URL_PEDIDOS = `${environment.apiUrl}/api/pedidos/mis-ordenes`;

const pedido = (datos: Partial<MiPedido>): MiPedido => ({
  idOrden: 1,
  codigoUnico: 'PE-AAAA1111',
  estado: 'PENDIENTE',
  tipoEntrega: 'RECOJO',
  metodoPago: 'CC',
  total: 25,
  fechaCreacion: '2026-10-20T14:30:15.123456',
  sedeNombre: 'La Marina',
  detalles: [{ productoNombre: 'Café Latte', cantidad: 2, precioUnitario: 12.5 }],
  ...datos,
});

const lista = [
  pedido({ idOrden: 1, codigoUnico: 'PE-AAAA1111', estado: 'PENDIENTE' }),
  pedido({ idOrden: 2, codigoUnico: 'PE-BBBB2222', estado: 'LISTO' }),
  pedido({ idOrden: 3, codigoUnico: 'PE-CCCC3333', estado: 'ENTREGADO' }),
  pedido({ idOrden: 4, codigoUnico: 'PE-DDDD4444', estado: 'CANCELADO' }),
];

describe('Orders', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Orders],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(respuesta: MiPedido[] = lista) {
    const fixture = TestBed.createComponent(Orders);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_PEDIDOS).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http };
  }

  const tarjetas = (el: HTMLElement) => el.querySelectorAll('article').length;
  const boton = (el: HTMLElement, texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(texto));

  it('lista los pedidos con su estado, sede, fecha y total', async () => {
    const { el } = await crear();

    expect(tarjetas(el)).toBe(4);
    expect(el.textContent).toContain('PE-AAAA1111');
    expect(el.textContent).toContain('Pendiente');
    expect(el.textContent).toContain('Listo para recoger');
    expect(el.textContent).toContain('Recojo en La Marina');
    expect(el.textContent).toContain('20/10/2026 14:30');
    expect(el.textContent).toContain('S/ 25.00');
  });

  it('muestra un mensaje si todavía no hay pedidos', async () => {
    const { el } = await crear([]);
    expect(el.textContent).toContain('Aún no tienes pedidos.');
  });

  it('solo ofrece cancelar los pedidos pendientes', async () => {
    const { el } = await crear();
    const cancelar = Array.from(el.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Cancelar pedido'),
    );
    expect(cancelar).toHaveLength(1);
  });

  it('filtra entre pedidos en curso e historial', async () => {
    const { fixture, el } = await crear();

    boton(el, 'En curso')?.click();
    await fixture.whenStable();
    expect(tarjetas(el)).toBe(2);

    boton(el, 'Historial')?.click();
    await fixture.whenStable();
    expect(tarjetas(el)).toBe(2);
    expect(el.textContent).toContain('PE-CCCC3333');
  });

  it('cancela un pedido pendiente después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(el, 'Cancelar pedido')?.click();
    const peticion = http.expectOne(`${URL_PEDIDOS}/1/cancelar`);
    expect(peticion.request.method).toBe('PUT');
    peticion.flush(pedido({ idOrden: 1, estado: 'CANCELADO' }));
    await fixture.whenStable();

    expect(el.textContent).toContain('Cancelaste el pedido PE-AAAA1111.');
    expect(
      Array.from(el.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Cancelar pedido'),
      ),
    ).toBe(false);
  });

  it('no cancela nada si el cliente no confirma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { el, http } = await crear();

    boton(el, 'Cancelar pedido')?.click();

    http.expectNone(`${URL_PEDIDOS}/1/cancelar`);
  });

  it('muestra el mensaje del servidor si el pedido ya no se puede cancelar y vuelve a leer la lista', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(el, 'Cancelar pedido')?.click();
    http
      .expectOne(`${URL_PEDIDOS}/1/cancelar`)
      .flush('Solo puedes cancelar pedidos que aún estén pendientes', {
        status: 409,
        statusText: 'Conflict',
      });
    http.expectOne(URL_PEDIDOS).flush([pedido({ idOrden: 1, estado: 'EN_PROCESO' })]);
    await fixture.whenStable();

    expect(el.textContent).toContain('Solo puedes cancelar pedidos que aún estén pendientes');
    expect(el.textContent).toContain('En proceso');
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const fixture = TestBed.createComponent(Orders);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_PEDIDOS).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No pudimos cargar tus pedidos');

    boton(el, 'Reintentar')?.click();
    http.expectOne(URL_PEDIDOS).flush(lista);
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(4);
  });

  it('actualiza la lista sola cada 30 segundos', async () => {
    const intervalo = vi.spyOn(globalThis, 'setInterval');
    const { fixture, el, http } = await crear();

    const [accion, milisegundos] =
      intervalo.mock.calls.find((llamada) => llamada[1] === 30_000) ?? [];
    expect(milisegundos).toBe(30_000);
    (accion as () => void)();
    http.expectOne(URL_PEDIDOS).flush([pedido({ idOrden: 1, estado: 'LISTO' })]);
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(1);
    expect(el.textContent).toContain('Listo para recoger');
  });
});