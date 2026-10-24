import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Categoria, Producto } from '../../../core/models/producto.models';
import { AdminProductoService } from '../../../core/services/admin-producto.service';
import { ProductoService } from '../../../core/services/producto.service';
import { mensajeDeError } from '../../../core/utils/mensaje-error';
import { normalizarTexto } from '../../../core/utils/texto';

type Carga = 'cargando' | 'listo' | 'error';

const STOCK_BAJO = 5;

@Component({
  selector: 'app-admin-products',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './admin-products.html',
})
export class AdminProducts implements OnInit {
  private readonly servicio = inject(AdminProductoService);
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);

  // Llega por la URL (?aviso=creado) cuando el formulario guarda y vuelve a esta lista
  readonly aviso = input<string>();

  protected readonly stockBajo = STOCK_BAJO;
  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaActiva = signal<number | null>(null);
  protected readonly busqueda = signal('');
  protected readonly soloStockBajo = signal(false);
  protected readonly procesando = signal<number | null>(null);
  protected readonly mensaje = signal<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  protected readonly visibles = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const categoria = this.categoriaActiva();
    return this.productos().filter(
      (p) =>
        (categoria === null || p.categoria?.idCategoria === categoria) &&
        (!this.soloStockBajo() || p.stock <= STOCK_BAJO) &&
        (texto === '' || normalizarTexto(`${p.nombre} ${p.descripcion}`).includes(texto)),
    );
  });

  private temporizadorLento?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const aviso = this.aviso();
    if (aviso === 'creado' || aviso === 'actualizado') {
      this.mensaje.set({ tipo: 'exito', texto: `Producto ${aviso}.` });
    }
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizadorLento));
    this.cargar();
  }

  protected cargar(): void {
    this.carga.set('cargando');
    this.servidorLento.set(false);
    // Render duerme el servidor gratuito: si tarda, avisamos
    this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);

    forkJoin({
      productos: this.servicio.listar(),
      categorias: this.productoService.listarCategorias(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ productos, categorias }) => {
          clearTimeout(this.temporizadorLento);
          this.productos.set(productos);
          this.categorias.set(categorias);
          this.carga.set('listo');
        },
        error: () => {
          clearTimeout(this.temporizadorLento);
          this.carga.set('error');
        },
      });
  }

  protected eliminar(producto: Producto): void {
    if (!confirm(`¿Eliminar «${producto.nombre}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.procesando.set(producto.idProducto);
    this.mensaje.set(null);
    this.servicio
      .eliminar(producto.idProducto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.productos.update((lista) =>
            lista.filter((p) => p.idProducto !== producto.idProducto),
          );
          this.mensaje.set({ tipo: 'exito', texto: `«${producto.nombre}» se eliminó.` });
        },
        error: (fallo: unknown) => {
          this.procesando.set(null);
          const base = mensajeDeError(fallo, 'No pudimos eliminar el producto.');
          // 409: el producto ya aparece en pedidos y la base de datos no deja borrarlo
          const pista =
            fallo instanceof HttpErrorResponse && fallo.status === 409
              ? ' Si ya no lo vendes, edítalo y ponle stock 0.'
              : '';
          this.mensaje.set({ tipo: 'error', texto: base + pista });
        },
      });
  }

  protected ocultarImagen(evento: Event): void {
    (evento.target as HTMLElement).classList.add('d-none');
  }
}