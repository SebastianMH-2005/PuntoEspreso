import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Producto } from '../../../core/models/producto.models';
import { AdminProductForm } from './admin-product-form';

const URL_ADMIN = `${environment.apiUrl}/api/admin/productos`;
const URL_PRODUCTOS = `${environment.apiUrl}/api/productos`;
const URL_CATEGORIAS = `${environment.apiUrl}/api/categorias`;

const bebidas = { idCategoria: 1, nombre: 'Bebidas' };
const granos = { idCategoria: 2, nombre: 'Café en Grano' };
const existente: Producto = {
  idProducto: 5,
  categoria: granos,
  nombre: 'Geisha 250g',
  precio: 45,
  descripcion: 'Café en grano de origen',
  stock: 4,
  imagen: 'geisha.jpg',
};

describe('AdminProductForm', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminProductForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function crear(id?: string, producto: Producto = existente) {
    const fixture = TestBed.createComponent(AdminProductForm);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    if (id) {
      fixture.componentRef.setInput('id', id);
    }
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_CATEGORIAS).flush([bebidas, granos]);
    if (id) {
      http.expectOne(`${URL_PRODUCTOS}/${id}`).flush(producto);
    }
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, http, navegar };
  }

  function escribir(el: HTMLElement, id: string, valor: string) {
    const campo = el.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function elegirCategoria(el: HTMLElement, posicion: number) {
    const selector = el.querySelector('#idCategoria') as HTMLSelectElement;
    selector.selectedIndex = posicion; // 0 es "Elige una categoría"
    selector.dispatchEvent(new Event('change'));
  }

  function completar(el: HTMLElement, cambios: Record<string, string> = {}) {
    elegirCategoria(el, 1);
    const datos: Record<string, string> = {
      nombre: '  Café Test  ',
      descripcion: ' Una descripción de prueba ',
      precio: '12.5',
      stock: '8',
      imagen: 'cafe-test.jpg',
      ...cambios,
    };
    Object.entries(datos).forEach(([id, valor]) => escribir(el, id, valor));
  }

  const guardar = (el: HTMLElement) =>
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

  it('pide los datos obligatorios antes de enviar', async () => {
    const { fixture, el, http } = await crear();

    guardar(el);
    await fixture.whenStable();

    http.expectNone(URL_ADMIN);
    expect(el.textContent).toContain('Este campo es obligatorio.');
    expect(el.textContent).toContain('Elige una categoría.');
  });

  it('valida precio, stock e imagen con las reglas del backend', async () => {
    const { fixture, el, http } = await crear();

    completar(el, { precio: '0', stock: '-1', imagen: 'foto.gif' });
    guardar(el);
    await fixture.whenStable();

    http.expectNone(URL_ADMIN);
    expect(el.textContent).toContain('El precio debe ser mayor a 0.');
    expect(el.textContent).toContain('El stock no puede ser negativo.');
    expect(el.textContent).toContain('Usa un nombre como cafe-latte.jpg');
  });

  it('el stock debe ser un número entero', async () => {
    const { fixture, el } = await crear();

    completar(el, { stock: '2.5' });
    guardar(el);
    await fixture.whenStable();

    expect(el.textContent).toContain('El stock debe ser un número entero.');
  });

  it('crea el producto con los datos limpios y vuelve a la lista', async () => {
    const { fixture, el, http, navegar } = await crear();

    completar(el);
    guardar(el);
    const peticion = http.expectOne(URL_ADMIN);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      idCategoria: 1,
      nombre: 'Café Test',
      descripcion: 'Una descripción de prueba',
      precio: 12.5,
      stock: 8,
      imagen: 'cafe-test.jpg',
    });
    peticion.flush({ ...existente, idProducto: 9 });
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith(['/admin/productos'], {
      queryParams: { aviso: 'creado' },
    });
  });

  it('en edición carga el producto, lo guarda con PUT y vuelve a la lista', async () => {
    const { fixture, el, http, navegar } = await crear('5');

    expect((el.querySelector('#nombre') as HTMLInputElement).value).toBe('Geisha 250g');
    expect((el.querySelector('#idCategoria') as HTMLSelectElement).selectedIndex).toBe(2);
    expect(el.textContent).toContain('Editar producto');

    escribir(el, 'stock', '12');
    guardar(el);
    const peticion = http.expectOne(`${URL_ADMIN}/5`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toMatchObject({ idCategoria: 2, stock: 12, precio: 45 });
    peticion.flush({ ...existente, stock: 12 });
    await fixture.whenStable();

    expect(navegar).toHaveBeenCalledWith(['/admin/productos'], {
      queryParams: { aviso: 'actualizado' },
    });
  });

  it('muestra el mensaje del servidor si no se pudo guardar', async () => {
    const { fixture, el, http } = await crear();

    completar(el);
    guardar(el);
    http
      .expectOne(URL_ADMIN)
      .flush({ message: 'Categoría no encontrada' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(el.textContent).toContain('Categoría no encontrada');
  });

  it('muestra un error si el producto a editar no existe', async () => {
    const fixture = TestBed.createComponent(AdminProductForm);
    fixture.componentRef.setInput('id', '99');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(URL_CATEGORIAS).flush([bebidas, granos]);
    http
      .expectOne(`${URL_PRODUCTOS}/99`)
      .flush(
        { message: 'No existe un producto con id 99' },
        { status: 404, statusText: 'Not Found' },
      );
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No existe un producto con id 99',
    );
  });

  it('rechaza un id que no es un número sin pedir nada al servidor', async () => {
    const fixture = TestBed.createComponent(AdminProductForm);
    fixture.componentRef.setInput('id', 'abc');
    fixture.detectChanges();
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectNone(URL_CATEGORIAS);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no es válido');
  });

  it('muestra la vista previa de la imagen y avisa si no existe en /img', async () => {
    const { fixture, el } = await crear();

    escribir(el, 'imagen', 'cafe-test.jpg');
    await fixture.whenStable();
    const vista = el.querySelector('img') as HTMLImageElement;
    expect(vista.getAttribute('src')).toBe('/img/cafe-test.jpg');
    expect(el.textContent).not.toContain('No encontramos esa imagen');

    vista.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(el.textContent).toContain('No encontramos esa imagen');
  });
});