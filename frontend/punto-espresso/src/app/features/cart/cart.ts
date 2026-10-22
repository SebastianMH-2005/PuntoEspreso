import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ProductoService } from '../../core/services/producto.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.html',
})
export class Cart implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cart = inject(CartService);

  protected readonly verificando = signal(false);
  protected readonly limite = signal<string | null>(null);

  ngOnInit(): void {
    if (this.cart.items().length === 0) {
      return;
    }
    // Se revisan precios y stock con el catálogo actual antes de que el cliente pague
    this.verificando.set(true);
    this.productoService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (productos) => {
          this.cart.sincronizar(productos);
          this.verificando.set(false);
        },
        error: () => this.verificando.set(false),
      });
  }

  protected cambiarCantidad(idProducto: number, delta: number, stock: number): void {
    const cambio = this.cart.cambiarCantidad(idProducto, delta);
    this.limite.set(
      !cambio && delta > 0 ? `Solo hay ${stock} unidades disponibles de este producto.` : null,
    );
  }

  protected vaciar(): void {
    if (confirm('¿Vaciar todo el carrito?')) {
      this.cart.vaciar();
    }
  }

  protected ocultarImagen(evento: Event): void {
    (evento.target as HTMLElement).classList.add('d-none');
  }
}