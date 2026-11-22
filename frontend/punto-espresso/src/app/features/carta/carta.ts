import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Producto } from '../../core/models/producto.models';
import { ProductoService } from '../../core/services/producto.service';

type Estado = 'cargando' | 'listo' | 'error';

/** Un apartado de la carta (por ejemplo "Bebidas") con sus productos. */
interface SeccionCarta {
  idCategoria: number;
  nombre: string;
  productos: Producto[];
}

const SIN_CATEGORIA = { idCategoria: 0, nombre: 'Otros' };

/** Agrupa los productos por categoría: categorías por orden de creación y productos por nombre. */
function agrupar(productos: Producto[]): SeccionCarta[] {
  const porCategoria = new Map<number, SeccionCarta>();
  for (const producto of productos) {
    const { idCategoria, nombre } = producto.categoria ?? SIN_CATEGORIA;
    const seccion = porCategoria.get(idCategoria) ?? { idCategoria, nombre, productos: [] };
    seccion.productos.push(producto);
    porCategoria.set(idCategoria, seccion);
  }
  return [...porCategoria.values()]
    .map((seccion) => ({
      ...seccion,
      productos: [...seccion.productos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    }))
    .sort((a, b) =>
      a.idCategoria === 0 ? 1 : b.idCategoria === 0 ? -1 : a.idCategoria - b.idCategoria,
    );
}

/** La carta: todas las bebidas y productos con su precio, en formato de pancarta imprimible. */
@Component({
  selector: 'app-carta',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './carta.html',
  styleUrl: './carta.scss',
})
export class Carta implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly secciones = computed(() => agrupar(this.productos()));

  private temporizadorLento?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizadorLento));
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    this.servidorLento.set(false);
    // Render duerme el servidor gratuito: si tarda, avisamos al visitante
    this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);

    this.productoService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          clearTimeout(this.temporizadorLento);
          this.productos.set(productos);
          this.estado.set('listo');
        },
        error: () => {
          clearTimeout(this.temporizadorLento);
          this.estado.set('error');
        },
      });
  }

  protected imprimir(): void {
    this.document.defaultView?.print();
  }
}