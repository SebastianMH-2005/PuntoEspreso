import { HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Dashboard } from '../../../core/models/admin.models';
import { AdminDashboard } from './admin-dashboard';

const URL_DASHBOARD = `${environment.apiUrl}/api/admin/dashboard`;
const conDias = (dias: number) => (r: HttpRequest<unknown>) =>
  r.url === URL_DASHBOARD && r.params.get('dias') === String(dias);

const datos = (cambios: Partial<Dashboard> = {}): Dashboard => ({
  dias: 7,
  pedidosHoy: 3,
  ventasHoy: 75.5,
  pedidosPeriodo: 12,
  ventasPeriodo: 480,
  ticketPromedio: 40,
  canceladosPeriodo: 2,
  pendientes: 4,
  enProceso: 1,
  listos: 2,
  ventasPorDia: [
    { fecha: '2026-10-23', pedidos: 4, total: 100 },
    { fecha: '2026-10-24', pedidos: 5, total: 50 },
    { fecha: '2026-10-25', pedidos: 3, total: 75.5 },
  ],
  masVendidos: [
    { nombre: 'Café Latte', unidades: 10, ingresos: 125 },
    { nombre: 'Frappé Mocha', unidades: 5, ingresos: 75 },
  ],
  stockBajo: [
    { idProducto: 3, nombre: 'Geisha 250g', stock: 0 },
    { idProducto: 7, nombre: 'Cold Brew', stock: 2 },
  ],
  ...cambios,
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
    };
  }

  async function crear(respuesta: Dashboard = datos()) {
    const { fixture, el, http } = montar();
    http.expectOne(conDias(7)).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el, http };
  }

  const boton = (el: HTMLElement, texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(texto));

  it('muestra las cifras principales del periodo', async () => {
    const { el } = await crear();

    expect(el.textContent).toContain('Pedidos hoy');
    expect(el.textContent).toContain('S/ 75.50');
    expect(el.textContent).toContain('S/ 480.00');
    expect(el.textContent).toContain('12 pedidos');
    expect(el.textContent).toContain('2 cancelados');
    expect(el.textContent).toContain('2 listos');
  });

  it('dibuja las barras en proporción al día con más ventas', async () => {
    const { el } = await crear();
    const barras = Array.from(el.querySelectorAll('.progress-bar')).map(
      (barra) => (barra as HTMLElement).style.width,
    );

    expect(barras.slice(0, 3)).toEqual(['100%', '50%', '76%']); // 100, 50 y 75.5 sobre 100
  });

  it('lista los productos más vendidos en orden', async () => {
    const { el } = await crear();

    expect(el.textContent).toContain('1. Café Latte');
    expect(el.textContent).toContain('10 u.');
    expect(el.textContent).toContain('2. Frappé Mocha');
  });

  it('enlaza el stock bajo con la edición del producto', async () => {
    const { el } = await crear();

    expect(el.textContent).toContain('Geisha 250g');
    expect(el.textContent).toContain('Agotado');
    expect(el.querySelector('a[href="/admin/productos/7/editar"]')).not.toBeNull();
  });

  it('muestra mensajes claros cuando todavía no hay datos', async () => {
    const { el } = await crear(
      datos({ masVendidos: [], stockBajo: [], ventasPorDia: [], pedidosHoy: 0, ventasHoy: 0 }),
    );

    expect(el.textContent).toContain('Todavía no hay ventas en este periodo.');
    expect(el.textContent).toContain('Todos los productos tienen stock suficiente.');
  });

  it('pide otro periodo al cambiar el rango', async () => {
    const { fixture, el, http } = await crear();

    boton(el, '14 días')?.click();
    http.expectOne(conDias(14)).flush(datos({ dias: 14 }));
    await fixture.whenStable();

    expect(el.textContent).toContain('Ventas (14 días)');
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const { fixture, el, http } = montar();
    http.expectOne(conDias(7)).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(el.textContent).toContain('No pudimos cargar el resumen');

    boton(el, 'Reintentar')?.click();
    http.expectOne(conDias(7)).flush(datos());
    await fixture.whenStable();

    expect(el.textContent).toContain('Pedidos hoy');
  });

  it('actualiza las cifras solas cada minuto', async () => {
    const intervalo = vi.spyOn(globalThis, 'setInterval');
    const { fixture, el, http } = await crear();

    const [accion, milisegundos] =
      intervalo.mock.calls.find((llamada) => llamada[1] === 60_000) ?? [];
    expect(milisegundos).toBe(60_000);
    (accion as () => void)();
    http.expectOne(conDias(7)).flush(datos({ pedidosHoy: 9 }));
    await fixture.whenStable();

    expect(el.textContent).toContain('9');
  });
});