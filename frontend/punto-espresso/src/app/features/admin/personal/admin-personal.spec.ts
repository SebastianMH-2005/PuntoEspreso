import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { UsuarioSistema } from '../../../core/models/admin.models';
import { AdminPersonal } from './admin-personal';

const URL_USUARIOS = `${environment.apiUrl}/api/admin/usuarios`;

const admin: UsuarioSistema = {
  idUsuarioSistema: 1,
  nombre: 'Administrador',
  email: 'admin@puntoespresso.pe',
  rol: 'ADMIN',
};
const luis: UsuarioSistema = {
  idUsuarioSistema: 2,
  nombre: 'Luis Gómez',
  email: 'luis@puntoespresso.pe',
  rol: 'OPERADOR',
};

describe('AdminPersonal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminPersonal],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(respuesta: UsuarioSistema[] = [admin, luis]) {
    const fixture = TestBed.createComponent(AdminPersonal);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_USUARIOS).flush(respuesta);
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
      nombre: '  Marta Ruiz ',
      email: ' Marta@PuntoEspresso.pe ',
      contrasena: 'clave-segura-1',
      ...cambios,
    };
    Object.entries(datos).forEach(([id, valor]) => escribir(el, id, valor));
  }

  const crearOperador = (el: HTMLElement) =>
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

  it('lista el personal y solo permite eliminar a los operadores', async () => {
    const { el } = await crear();

    expect(filas(el)).toHaveLength(2);
    expect(el.textContent).toContain('Administrador');
    expect(el.textContent).toContain('luis@puntoespresso.pe');
    expect(boton(filas(el)[0], 'Eliminar')).toBeUndefined();
    expect(boton(filas(el)[1], 'Eliminar')).toBeDefined();
  });

  it('valida nombre, email y contraseña antes de enviar', async () => {
    const { fixture, el, http } = await crear();

    completar(el, { nombre: '   ', email: 'no-es-un-email', contrasena: 'corta' });
    crearOperador(el);
    await fixture.whenStable();

    http.expectNone(URL_USUARIOS);
    expect(el.textContent).toContain('Este campo es obligatorio.');
    expect(el.textContent).toContain('Ingresa un email válido.');
    expect(el.textContent).toContain('Debe tener al menos 8 caracteres.');
  });

  it('crea el operador con los datos limpios y lo agrega a la lista', async () => {
    const { fixture, el, http } = await crear();

    completar(el);
    crearOperador(el);
    const peticion = http.expectOne(URL_USUARIOS);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      nombre: 'Marta Ruiz',
      email: 'marta@puntoespresso.pe',
      contrasena: 'clave-segura-1',
    });
    peticion.flush({
      idUsuarioSistema: 3,
      nombre: 'Marta Ruiz',
      email: 'marta@puntoespresso.pe',
      rol: 'OPERADOR',
    });
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(3);
    expect(el.textContent).toContain('Operador «Marta Ruiz» creado.');
    expect((el.querySelector('#nombre') as HTMLInputElement).value).toBe('');
  });

  it('muestra el mensaje del servidor si el email ya existe', async () => {
    const { fixture, el, http } = await crear();

    completar(el);
    crearOperador(el);
    http
      .expectOne(URL_USUARIOS)
      .flush('Ya existe una cuenta con ese email', { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Ya existe una cuenta con ese email');
    expect(filas(el)).toHaveLength(2);
  });

  it('elimina un operador después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(filas(el)[1], 'Eliminar')?.click();
    const peticion = http.expectOne(`${URL_USUARIOS}/2`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(1);
    expect(el.textContent).toContain('Operador «Luis Gómez» eliminado.');
  });

  it('no elimina nada si el administrador no confirma', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { el, http } = await crear();

    boton(filas(el)[1], 'Eliminar')?.click();

    http.expectNone(`${URL_USUARIOS}/2`);
  });

  it('explica por qué no se puede eliminar un operador que ya atendió pedidos', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fixture, el, http } = await crear();

    boton(filas(el)[1], 'Eliminar')?.click();
    http
      .expectOne(`${URL_USUARIOS}/2`)
      .flush(
        { message: 'No se puede completar la operación: el registro está en uso o está duplicado' },
        { status: 409, statusText: 'Conflict' },
      );
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(2);
    expect(el.textContent).toContain('ya atendió pedidos');
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const fixture = TestBed.createComponent(AdminPersonal);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_USUARIOS).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No pudimos cargar el personal');

    boton(el, 'Reintentar')?.click();
    http.expectOne(URL_USUARIOS).flush([admin, luis]);
    await fixture.whenStable();

    expect(filas(el)).toHaveLength(2);
  });
});