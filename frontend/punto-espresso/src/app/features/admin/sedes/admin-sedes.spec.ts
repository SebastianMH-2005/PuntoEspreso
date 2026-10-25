import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Sede } from '../../../core/models/sede.models';
import { AdminSedes } from './admin-sedes';

const URL_SEDES = `${environment.apiUrl}/api/admin/sedes`;

const sede = (datos: Partial<Sede>): Sede => ({
  idSede: 1,
  nombre: 'La Marina',
  direccion: 'Av. de la Marina 2500, San Miguel',
  horarioDias: 'Lunes a Domingo',
  horarioHoras: '10:30 — 21:00',
  ...datos,
});
const lista = [sede({ idSede: 1 }), sede({ idSede: 2, nombre: 'San Isidro' })];

describe('AdminSedes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminSedes],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(respuesta: Sede[] = lista) {
    const fixture = TestBed.createComponent(AdminSedes);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_SEDES).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http };
  }

  const filas = (el: HTMLElement) => el.querySelectorAll('tbody tr');
  const boton = (el: HTMLElement | Element, texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(texto));

  function escribir(el: HTMLElement, id: string, valor: string) {
    const campo = el.querySelector(`#${id}`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function completar(el: HTMLElement, cambios: Record<string, string> = {}) {
    const datos: Record<string, string> = {
      nombre: '  Tostaduría  ',
      direccion: ' Jr. Carlos Jiménez 147, Lima ',
      horarioDias: 'Lunes a Sábado',
      horarioHoras: '08:00 — 18:00',
      ...cambios,
    };
    Object.entries(datos).forEach(([id, valor]) => escribir(el, id, valor));
  }

  const guardar = (el: HTMLElement) =>
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

  it('lista las sedes con su dirección y horario', async () => {
    const { el } = await crear();

    expect(filas(el)).toHaveLength(2);
    expect(el.textContent).toContain('La Marina');
    expect(el.textContent).toContain('Av. de la Marina 2500');
    expect(el.textContent).toContain('10:30 — 21:00');
  });

  it('muestra un mensaje si todavía no hay sedes', async () => {
    const { el } = await crear([]);
    expect(el.textContent).toContain('Todavía no hay sedes');
  });

  it('pide todos los campos antes de crear una sede', async () => {
    const { fixture, el, http } = await crear();

    boton(el, 'Nueva sede')?.click();
    await fixture.whenStable();
    guardar(el);
    await fixture.whenStable();

    http.expectNone(URL_SEDES);
    expect(el.textContent).toContain('Este campo es obligatorio.');
  });

  it('crea una sede con los datos limpios y la agrega a la lista', async () => {
    const { fixture, el, http } = await crear();

    boton(el, 'Nueva sede')?.click();
    await fixture.whenStable();
    completar(el);
    guardar(el);
    const peticion = http.expectOne(URL_SEDES);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      nombre: 'Tostaduría',
      direccion: 'Jr. Carlos Jiménez 147, Lima',
      horarioDias: 'Lunes a Sábado',
      horarioHoras: '08:00 — 18:00',
    });
    peticion.flush(sede({ idSede: 3, nombre: 'Tostaduría' }));
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(3);
    expect(el.textContent).toContain('Sede «Tostaduría» creada.');
    expect(el.querySelector('form')).toBeNull();
  });

  it('edita una sede con el formulario prellenado', async () => {
    const { fixture, el, http } = await crear();

    boton(filas(el)[1], 'Editar')?.click();
    await fixture.whenStable();
    expect((el.querySelector('#nombre') as HTMLInputElement).value).toBe('San Isidro');

    escribir(el, 'direccion', 'Av. Paseo de la República 3440');
    guardar(el);
    const peticion = http.expectOne(`${URL_SEDES}/2`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toMatchObject({ nombre: 'San Isidro' });
    peticion.flush(
      sede({ idSede: 2, nombre: 'San Isidro', direccion: 'Av. Paseo de la República 3440' }),
    );
    await fixture.whenStable();

    expect(el.textContent).toContain('Sede «San Isidro» actualizada.');
    expect(el.textContent).toContain('Av. Paseo de la República 3440');
    expect(filas(el)).toHaveLength(2);
  });

  it('cancela la edición sin enviar nada', async () => {
    const { fixture, el, http } = await crear();

    boton(el, 'Nueva sede')?.click();
    await fixture.whenStable();
    boton(el, 'Cancelar')?.click();
    await fixture.whenStable();

    expect(el.querySelector('form')).toBeNull();
    http.expectNone(URL_SEDES);
  });

  it('muestra el mensaje del servidor si no se pudo guardar', async () => {
    const { fixture, el, http } = await crear();

    boton(el, 'Nueva sede')?.click();
    await fixture.whenStable();
    completar(el);
    guardar(el);
    http
      .expectOne(URL_SEDES)
      .flush({ message: 'Nombre demasiado largo' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Nombre demasiado largo');
    expect(el.querySelector('form')).not.toBeNull();
  });

  it('elimina una sede después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(filas(el)[0], 'Eliminar')?.click();
    const peticion = http.expectOne(`${URL_SEDES}/1`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(1);
    expect(el.textContent).toContain('Sede «La Marina» eliminada.');
  });

  it('explica por qué no se puede eliminar una sede con pedidos', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(filas(el)[0], 'Eliminar')?.click();
    http
      .expectOne(`${URL_SEDES}/1`)
      .flush(
        { message: 'No se puede completar la operación: el registro está en uso o está duplicado' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(2);
    expect(el.textContent).toContain('el registro está en uso');
    expect(el.textContent).toContain('ya tiene pedidos');
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const fixture = TestBed.createComponent(AdminSedes);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_SEDES).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No pudimos cargar las sedes');

    boton(el, 'Reintentar')?.click();
    http.expectOne(URL_SEDES).flush(lista);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(2);
  });
});