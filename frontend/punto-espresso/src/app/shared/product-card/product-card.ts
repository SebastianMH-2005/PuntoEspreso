import { CurrencyPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { Producto } from '../../core/models/producto.models';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly producto = input.required<Producto>();
  /** Unidades de este producto que ya están en el carrito */
  readonly enCarrito = input(0);
  readonly agregar = output<Producto>();

  protected readonly imagenRota = signal(false);
  protected readonly urlImagen = computed(() => `/img/${this.producto().imagen}`);
  protected readonly disponible = computed(() => this.producto().stock > 0);
  protected readonly restante = computed(() => this.producto().stock - this.enCarrito());
  protected readonly esGrano = computed(
    () => this.producto().categoria?.nombre === 'Café en Grano',
  );
}