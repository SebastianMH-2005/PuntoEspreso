import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Register } from './register';

const URL_REGISTRO = `${environment.apiUrl}/api/auth/registro`;

describe('Register', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    return { fixture, el, http, navegar };
  }

  function escribir(el: HTMLElement, id: string, valor: string) {
    const campo = el.querySelector(`#${id}`) as HTMLInputElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function completar(el: HTMLElement, cambios: Record<string, string> = {}) {
    const datos: Record<string, string> = {
      nombre: ' Ana Pérez ',
      dni: '12345678',
      telefono: '987654321',
      email: 'Ana@Mail.com',
      contrasena: 'secreta123',
      confirmacion: 'secreta123',
      ...cambios,
    };
    Object.entries(datos).forEach(([id, valor]) => escribir(el, id, valor));
  }

  const enviar = (el: HTMLElement) =>
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

  it('valida DNI, teléfono y contraseña con las reglas del backend', async () => {
    const { fixture, el, http } = crear();

    completar(el, {
      dni: '123',
      telefono: '812345678',
      contrasena: 'corta',
      confirmacion: 'corta',
    });
    enviar(el);
    await fixture.whenStable();

    http.expectNone(URL_REGISTRO);
    expect(el.textContent).toContain('El DNI debe tener 8 dígitos.');
    expect(el.textContent).toContain('Debe tener 9 dígitos y empezar con 9.');
    expect(el.textContent).toContain('Debe tener al menos 8 caracteres.');
  });

  it('avisa si las contraseñas no coinciden', async () => {
    const { fixture, el, http } = crear();

    completar(el, { confirmacion: 'otra-distinta' });
    enviar(el);
    await fixture.whenStable();

    http.expectNone(URL_REGISTRO);
    expect(el.textContent).toContain('Las contraseñas no coinciden.');
  });

  it('rechaza un nombre formado solo por espacios', async () => {
    const { fixture, el, http } = crear();

    completar(el, { nombre: '    ' });
    enviar(el);
    await fixture.whenStable();

    http.expectNone(URL_REGISTRO);
    expect(el.textContent).toContain('Este campo es obligatorio.');
  });

  it('envía los datos limpios y lleva al login con el aviso de cuenta creada', async () => {
    const { fixture, el, http, navegar } = crear();

    completar(el);
    enviar(el);
    const peticion = http.expectOne(URL_REGISTRO);
    expect(peticion.request.body).toEqual({
      nombre: 'Ana Pérez',
      dni: '12345678',
      email: 'ana@mail.com',
      telefono: '987654321',
      contrasena: 'secreta123',
    });
    peticion.flush(null);
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { registrado: '1' } });
  });

  it('muestra el mensaje del servidor cuando el email ya existe', async () => {
    const { fixture, el, http } = crear();

    completar(el);
    enviar(el);
    http
      .expectOne(URL_REGISTRO)
      .flush('Ya existe una cuenta con ese email', { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Ya existe una cuenta con ese email');
  });
});