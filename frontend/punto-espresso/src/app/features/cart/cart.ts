import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { CartService, ItemCarrito } from '../../core/services/cart.service';
import { ProductoService } from '../../core/services/producto.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './cart.html',
})
export class Cart implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cart = inject(CartService);

  protected readonly verificando = signal(false);
  protected readonly limite = signal<string | null>(null);

  // Un campo reactivo por producto para sus instrucciones
  private readonly notas = new Map<number, FormControl<string>>();

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

  /** Campo de instrucciones del producto: se crea la primera vez y guarda la nota al dejar de escribir. */
  protected notaDe(item: ItemCarrito): FormControl<string> {
    const existente = this.notas.get(item.idProducto);
    if (existente) {
      return existente;
    }

    const control = new FormControl(item.instrucciones ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    });
    control.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((texto) => {
        if (control.valid) {
          this.cart.actualizarInstrucciones(item.idProducto, texto);
        }
      });
    this.notas.set(item.idProducto, control);
    return control;
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