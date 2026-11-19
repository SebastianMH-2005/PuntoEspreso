import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Categoria, Producto } from '../../core/models/producto.models';
import { CartService } from '../../core/services/cart.service';
import { ProductoService } from '../../core/services/producto.service';
import { normalizarTexto } from '../../core/utils/texto';
import { ProductCard } from '../../shared/product-card/product-card';

type Estado = 'cargando' | 'listo' | 'error';


@Component({
  selector: 'app-catalog',
  imports: [ProductCard, ReactiveFormsModule],
  templateUrl: './catalog.html',
})
export class Catalog implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cart = inject(CartService);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaActiva = signal<number | null>(null);
  protected readonly busquedaControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(60)],
  });
  protected readonly busqueda = toSignal(this.busquedaControl.valueChanges, { initialValue: '' });
  protected readonly aviso = signal<string | null>(null);

  protected readonly visibles = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    const categoria = this.categoriaActiva();
    return this.productos().filter(
      (p) =>
        (categoria === null || p.categoria?.idCategoria === categoria) &&
        (texto === '' || normalizarTexto(`${p.nombre} ${p.descripcion}`).includes(texto)),
    );
  });

  private temporizadorLento?: ReturnType<typeof setTimeout>;
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.temporizadorLento);
      clearTimeout(this.temporizadorAviso);
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    this.servidorLento.set(false);
    // Render duerme el servidor gratuito: si tarda, avisamos al visitante
    this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);

    forkJoin({
      productos: this.productoService.listar(),
      categorias: this.productoService.listarCategorias(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ productos, categorias }) => {
          clearTimeout(this.temporizadorLento);
          this.productos.set(productos);
          this.categorias.set(categorias);
          this.estado.set('listo');
        },
        error: () => {
          clearTimeout(this.temporizadorLento);
          this.estado.set('error');
        },
      });
  }

  protected agregar(producto: Producto): void {
    const agregadas = this.cart.agregar(producto);
    this.mostrarAviso(
      agregadas > 0
        ? `«${producto.nombre}» se agregó al carrito (${this.cart.totalUnidades()} en total).`
        : `Ya tienes todo el stock disponible de «${producto.nombre}» en tu carrito.`,
    );
  }

  private mostrarAviso(mensaje: string): void {
    this.aviso.set(mensaje);
    clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = setTimeout(() => this.aviso.set(null), 3000);
  }
}