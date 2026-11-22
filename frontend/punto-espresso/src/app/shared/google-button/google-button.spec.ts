import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { GoogleButton } from './google-button';

const URL_GOOGLE = `${environment.apiUrl}/api/auth/google`;

describe('GoogleButton', () => {
  beforeEach(() => localStorage.clear());

  async function crear(disponible: boolean, dibujarBoton = vi.fn().mockResolvedValue(undefined)) {
    await TestBed.configureTestingModule({
      imports: [GoogleButton],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GoogleAuthService, useValue: { disponible, dibujarBoton } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GoogleButton);
    const iniciada = vi.fn();
    const fallo = vi.fn();
    fixture.componentInstance.iniciada.subscribe(iniciada);
    fixture.componentInstance.fallo.subscribe(fallo);
    await fixture.whenStable();
    return {
      el: fixture.nativeElement as HTMLElement,
      dibujarBoton,
      iniciada,
      fallo,
      http: TestBed.inject(HttpTestingController),
    };
  }

  function recibirCredencial(dibujarBoton: ReturnType<typeof vi.fn>, credencial: string) {
    const [, alRecibir] = dibujarBoton.mock.calls[0] as [HTMLElement, (c: string) => void];
    alRecibir(credencial);
  }

  it('no muestra nada si no hay un ID de cliente de Google configurado', async () => {
    const { el, dibujarBoton } = await crear(false);

    expect(el.textContent?.trim()).toBe('');
    expect(dibujarBoton).not.toHaveBeenCalled();
  });

  it('dibuja el botón de Google en su contenedor cuando está configurado', async () => {
    const { el, dibujarBoton } = await crear(true);

    expect(el.textContent).toContain('o continúa con');
    expect(dibujarBoton).toHaveBeenCalledTimes(1);
    expect(dibujarBoton.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    expect(typeof dibujarBoton.mock.calls[0][1]).toBe('function');
  });

  it('al recibir la credencial inicia sesión en el backend y avisa', async () => {
    const { dibujarBoton, iniciada, http } = await crear(true);

    recibirCredencial(dibujarBoton, 'credencial-de-google');
    const peticion = http.expectOne(URL_GOOGLE);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ credencial: 'credencial-de-google' });
    peticion.flush({ token: 'abc', nombre: 'Ana', rol: 'CLIENTE' });

    expect(iniciada).toHaveBeenCalled();
    const auth = TestBed.inject(AuthService);
    expect(auth.nombre()).toBe('Ana');
    expect(auth.esCliente()).toBe(true);
  });

  it('avisa si el servidor no pudo verificar la cuenta de Google (401)', async () => {
    const { dibujarBoton, fallo, iniciada, http } = await crear(true);

    recibirCredencial(dibujarBoton, 'falsa');
    http.expectOne(URL_GOOGLE).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(iniciada).not.toHaveBeenCalled();
    expect(fallo).toHaveBeenCalledWith('No pudimos verificar tu cuenta de Google. Inténtalo de nuevo.');
  });

  it('muestra el mensaje del servidor cuando la cuenta es del personal (409)', async () => {
    const { dibujarBoton, fallo, http } = await crear(true);

    recibirCredencial(dibujarBoton, 'del-personal');
    http.expectOne(URL_GOOGLE).flush(
      { message: 'Esta cuenta es del personal. Inicia sesión con tu correo y contraseña.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(fallo).toHaveBeenCalledWith(
      'Esta cuenta es del personal. Inicia sesión con tu correo y contraseña.',
    );
  });

  it('avisa si no se pudo cargar el script de Google', async () => {
    const { fallo } = await crear(true, vi.fn().mockRejectedValue(new Error('sin red')));
    await Promise.resolve();

    expect(fallo).toHaveBeenCalledWith(
      'No pudimos cargar el inicio de sesión con Google. Prueba con tu correo y contraseña.',
    );
  });
});