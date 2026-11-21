import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { CartService } from '../../core/services/cart.service';
import { Header } from './header';

function iniciarSesion(rol: string, nombre = 'Ana María') {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  localStorage.setItem('token', `cabecera.${btoa(JSON.stringify({ exp }))}.firma`);
  localStorage.setItem('nombre', nombre);
  localStorage.setItem('rol', rol);
}

describe('Header', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  async function crear() {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const botonUsuario = (el: HTMLElement) => el.querySelector('.boton-usuario') as HTMLButtonElement;
  const menu = (el: HTMLElement) => el.querySelector('.dropdown-menu');

  it('sin sesión ofrece Ingresar y no muestra el menú de usuario', async () => {
    const { el } = await crear();

    expect(el.textContent).toContain('Ingresar');
    expect(botonUsuario(el)).toBeNull();
  });

  it('con sesión muestra solo el primer nombre y el menú empieza cerrado', async () => {
    iniciarSesion('CLIENTE');
    const { el } = await crear();

    expect(botonUsuario(el).textContent).toContain('Ana');
    expect(botonUsuario(el).textContent).not.toContain('María');
    expect(menu(el)).toBeNull();
  });

  it('al pulsar el nombre se abre el menú con Mis pedidos y Cerrar sesión', async () => {
    iniciarSesion('CLIENTE');
    const { fixture, el } = await crear();

    botonUsuario(el).click();
    await fixture.whenStable();

    expect(menu(el)?.textContent).toContain('Mis pedidos');
    expect(menu(el)?.textContent).toContain('Cerrar sesión');
    expect(botonUsuario(el).getAttribute('aria-expanded')).toBe('true');
  });

  it('el personal ve Panel en el menú y no Mis pedidos', async () => {
    iniciarSesion('ADMIN', 'Luis');
    const { fixture, el } = await crear();

    botonUsuario(el).click();
    await fixture.whenStable();

    expect(menu(el)?.textContent).toContain('Panel');
    expect(menu(el)?.textContent).not.toContain('Mis pedidos');
  });

  it('la tecla Escape cierra el menú', async () => {
    iniciarSesion('CLIENTE');
    const { fixture, el } = await crear();
    botonUsuario(el).click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(menu(el)).toBeNull();
  });

  it('un clic fuera del menú lo cierra', async () => {
    iniciarSesion('CLIENTE');
    const { fixture, el } = await crear();
    botonUsuario(el).click();
    await fixture.whenStable();

    document.body.click();
    await fixture.whenStable();

    expect(menu(el)).toBeNull();
  });

  it('Cerrar sesión vacía el carrito y lleva a la despedida con el nombre', async () => {
    iniciarSesion('CLIENTE');
    const { fixture, el } = await crear();
    const vaciar = vi.spyOn(TestBed.inject(CartService), 'vaciar');
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    botonUsuario(el).click();
    await fixture.whenStable();

    const cerrar = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Cerrar sesión'),
    ) as HTMLButtonElement;
    cerrar.click();

    expect(vaciar).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/hasta-pronto?nombre=Ana');
  });
});