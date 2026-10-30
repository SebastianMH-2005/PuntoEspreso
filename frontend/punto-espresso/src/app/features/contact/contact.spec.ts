import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Sede } from '../../core/models/sede.models';
import { Contact } from './contact';

const URL_SEDES = `${environment.apiUrl}/api/sedes`;
const sedes: Sede[] = [
  {
    idSede: 1,
    nombre: 'Cafetería La Marina',
    direccion: 'Avenida de la Marina 2500, San Miguel',
    horarioDias: 'Lunes a Domingo',
    horarioHoras: '10:30 — 21:00',
  },
  {
    idSede: 2,
    nombre: 'Cafetería San Isidro',
    direccion: 'Avenida Paseo de la República 3440, San Isidro',
    horarioDias: 'Lunes a Domingo',
    horarioHoras: '08:00 — 21:30',
  },
];

describe('Contact', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Contact],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    return {
      fixture,
      el: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
    };
  }

  async function crear(respuesta: Sede[] = sedes) {
    const { fixture, el, http } = montar();
    http.expectOne(URL_SEDES).flush(respuesta);
    await fixture.whenStable();
    return { fixture, el, http };
  }

  const tarjetas = (el: HTMLElement) => el.querySelectorAll('article').length;

  it('lista los locales con su dirección y horario', async () => {
    const { el } = await crear();

    expect(tarjetas(el)).toBe(2);
    expect(el.textContent).toContain('Cafetería La Marina');
    expect(el.textContent).toContain('Avenida de la Marina 2500, San Miguel');
    expect(el.textContent).toContain('10:30 — 21:00');
  });

  it('filtra por distrito sin importar tildes ni mayúsculas', async () => {
    const { fixture, el } = await crear();
    const caja = el.querySelector('input[type="search"]') as HTMLInputElement;

    caja.value = 'SAN ISIDRO';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(1);
    expect(el.textContent).toContain('Cafetería San Isidro');
  });

  it('avisa si no hay locales en la zona buscada', async () => {
    const { fixture, el } = await crear();
    const caja = el.querySelector('input[type="search"]') as HTMLInputElement;

    caja.value = 'Chorrillos';
    caja.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(el.textContent).toContain('No encontramos locales en esa zona');
  });

  it('enlaza cada local con Google Maps', async () => {
    const { el } = await crear();
    const enlace = el.querySelector('article a') as HTMLAnchorElement;

    expect(enlace.getAttribute('href')).toContain(
      'https://www.google.com/maps/search/?api=1&query=',
    );
    expect(enlace.getAttribute('href')).toContain(encodeURIComponent('Avenida de la Marina 2500'));
    expect(enlace.getAttribute('rel')).toBe('noopener');
  });

  it('ofrece el correo de contacto', async () => {
    const { el } = await crear();
    expect(el.querySelector('a[href="mailto:contacto@puntoespresso.pe"]')).not.toBeNull();
  });

  it('muestra el error al cargar y permite reintentar', async () => {
    const { fixture, el, http } = montar();
    http.expectOne(URL_SEDES).flush('', { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(el.textContent).toContain('No pudimos cargar los locales');

    (el.querySelector('.alert-danger button') as HTMLButtonElement).click();
    http.expectOne(URL_SEDES).flush(sedes);
    await fixture.whenStable();

    expect(tarjetas(el)).toBe(2);
  });
});