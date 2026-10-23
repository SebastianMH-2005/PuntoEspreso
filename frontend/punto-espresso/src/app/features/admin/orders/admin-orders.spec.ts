import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { OrdenAdmin } from '../../../core/models/admin.models';
import { AdminOrders } from './admin-orders';

const URL_ORDENES = `${environment.apiUrl}/api/admin/ordenes`;

const orden = (datos: Partial<OrdenAdmin>): OrdenAdmin => ({
  idOrden: 1,
  clienteNombre: 'Ana Pérez',
  clienteEmail: 'ana@mail.com',
  tipoEntrega: 'RECOJO',
  metodoPago: 'CC',
  estado: 'PENDIENTE',
  codigoUnico: 'PE-AAAA1111',
  total: 25,
  fechaCreacion: '2026-10-20T14:30:15.123456',
  sedeNombre: 'La Marina',
  detalles: [{ productoNombre: 'Café Latte', cantidad: 2, precioUnitario: 12.5 }],
  ...datos,
});

const lista = [
  orden({ idOrden: 1, codigoUnico: 'PE-AAAA1111', estado: 'PENDIENTE' }),
  orden({
    idOrden: 2,
    codigoUnico: 'PE-BBBB2222',
    estado: 'EN_PROCESO',
    clienteNombre: 'Luis Gómez',
    clienteEmail: 'luis@mail.com',
  }),
  orden({ idOrden: 3, codigoUnico: 'PE-CCCC3333', estado: 'ENTREGADO' }),
];

const sinFiltro = (r: HttpRequest<unknown>) => r.url === URL_ORDENES && !r.params.has('estado');
const conFiltro = (estado: string) => (r: HttpRequest<unknown>) =>
  r.url === URL_ORDENES && r.params.get('estado') === estado;

describe('AdminOrders', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminOrders],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(respuesta: OrdenAdmin[] = lista) {
    const fixture = TestBed.createComponent(AdminOrders);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(sinFiltro).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http };
  }

  const filas = (el: HTMLElement) => el.querySelectorAll('tbody tr');
  const botones = (el: HTMLElement | Element, texto: string) =>
    Array.from(el.querySelectorAll('button')).filter((b) => b.textContent?.includes(texto));

  it('lista las órdenes con cliente, sede, estado y total', async () => {
    const { el } = await crear();

    expect(filas(el)).toHaveLength(3);
    expect(el.textContent).toContain('PE-AAAA1111');
    expect(el.textContent).toContain('Ana Pérez');
    expect(el.textContent).toContain('ana@mail.com');
    expect(el.textContent).toContain('La Marina');
    expect(el.textContent).toContain('S/ 25.00');
    expect(el.textContent).toContain('1 por atender');
  });

  it('ofrece el siguiente paso según el estado y nada en las órdenes terminadas', async () => {
    const { el } = await crear();
    const [pendiente, enProceso, entregada] = Array.from(filas(el));

    expect(botones(pendiente, 'Iniciar preparación')).toHaveLength(1);
    expect(botones(pendiente, 'Cancelar')).toHaveLength(1);
    expect(botones(enProceso, 'Marcar listo')).toHaveLength(1);
    expect(entregada.querySelectorAll('button')).toHaveLength(0);
  });

  it('avanza el estado de una orden', async () => {
    const { fixture, el, http } = await crear();

    botones(el, 'Iniciar preparación')[0].click();
    const peticion = http.expectOne(`${URL_ORDENES}/1/estado`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ estado: 'EN_PROCESO' });
    peticion.flush(orden({ idOrden: 1, estado: 'EN_PROCESO' }));
    await fixture.whenStable();

    expect(el.textContent).toContain('Pedido PE-AAAA1111: en proceso.');
    expect(botones(el, 'Iniciar preparación')).toHaveLength(0);
    expect(botones(el, 'Marcar listo')).toHaveLength(2);
  });

  it('cancela una orden solo después de confirmar', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { fixture, el, http } = await crear();

    botones(el, 'Cancelar')[0].click();
    http.expectNone(`${URL_ORDENES}/1/estado`);

    confirmar.mockReturnValue(true);
    botones(el, 'Cancelar')[0].click();
    const peticion = http.expectOne(`${URL_ORDENES}/1/estado`);
    expect(peticion.request.body).toEqual({ estado: 'CANCELADO' });
    peticion.flush(orden({ idOrden: 1, estado: 'CANCELADO' }));
    await fixture.whenStable();

    expect(el.textContent).toContain('Pedido PE-AAAA1111: cancelado.');
  });

  it('pide al servidor solo las órdenes del estado elegido', async () => {
    const { fixture, el, http } = await crear();
    const selector = el.querySelector('select') as HTMLSelectElement;

    selector.value = 'PENDIENTE';
    selector.dispatchEvent(new Event('change'));
    http.expectOne(conFiltro('PENDIENTE')).flush([lista[0]]);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(1);
  });

  it('con un filtro activo, la orden sale de la lista al cambiar de estado', async () => {
    const { fixture, el, http } = await crear();
    const selector = el.querySelector('select') as HTMLSelectElement;
    selector.value = 'PENDIENTE';
    selector.dispatchEvent(new Event('change'));
    http.expectOne(conFiltro('PENDIENTE')).flush([lista[0]]);
    await fixture.whenStable();

    botones(el, 'Iniciar preparación')[0].click();
    http.expectOne(`${URL_ORDENES}/1/estado`).flush(orden({ idOrden: 1, estado: 'EN_PROCESO' }));
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(0);
    expect(el.textContent).toContain('No hay órdenes que coincidan');
  });

  it('busca por código, nombre o email sin importar tildes', async () => {
    const { fixture, el } = await crear();
    const caja = el.querySelector('input[type="search"]') as HTMLInputElement;

    caja.value = 'gomez';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(1);
    expect(el.textContent).toContain('Luis Gómez');
  });

  it('muestra el mensaje del servidor si la orden ya no se puede modificar y recarga la lista', async () => {
    const { fixture, el, http } = await crear();

    botones(el, 'Iniciar preparación')[0].click();
    http
      .expectOne(`${URL_ORDENES}/1/estado`)
      .flush('La orden está en estado CANCELADO y ya no se puede modificar', {
        status: 409,
        statusText: 'Conflict',
      });
    http.expectOne(sinFiltro).flush([orden({ idOrden: 1, estado: 'CANCELADO' })]);
    await fixture.whenStable();

    expect(el.textContent).toContain('ya no se puede modificar');
    expect(el.textContent).toContain('Cancelado');
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const fixture = TestBed.createComponent(AdminOrders);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(sinFiltro).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No pudimos cargar las órdenes');

    botones(el, 'Reintentar')[0].click();
    http.expectOne(sinFiltro).flush(lista);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(3);
  });

  it('actualiza la lista sola cada 20 segundos', async () => {
    const intervalo = vi.spyOn(globalThis, 'setInterval');
    const { fixture, el, http } = await crear();

    const [accion, milisegundos] =
      intervalo.mock.calls.find((llamada) => llamada[1] === 20_000) ?? [];
    expect(milisegundos).toBe(20_000);
    (accion as () => void)();
    http.expectOne(sinFiltro).flush([...lista, orden({ idOrden: 4, codigoUnico: 'PE-DDDD4444' })]);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(4);
  });
});