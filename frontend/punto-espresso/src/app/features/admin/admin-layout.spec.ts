import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayout } from './admin-layout';

function iniciarSesion(rol: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  localStorage.setItem('token', `cabecera.${btoa(JSON.stringify({ exp }))}.firma`);
  localStorage.setItem('nombre', 'Ana');
  localStorage.setItem('rol', rol);
}

describe('AdminLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [provideRouter([]), provideHttpClient()],
    });
  });

  async function pestanas(rol: string) {
    iniciarSesion(rol);
    const fixture = TestBed.createComponent(AdminLayout);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      el,
      textos: Array.from(el.querySelectorAll('.nav-link')).map((a) => a.textContent?.trim()),
    };
  }

  it('el administrador ve todas las pestañas', async () => {
    const { el, textos } = await pestanas('ADMIN');

    expect(textos).toEqual(['Órdenes', 'Productos', 'Sedes', 'Personal']);
    expect(el.textContent).toContain('Administrador');
  });

  it('el operador solo ve las órdenes', async () => {
    const { el, textos } = await pestanas('OPERADOR');

    expect(textos).toEqual(['Órdenes']);
    expect(el.textContent).toContain('Operador');
  });
});