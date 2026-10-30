import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Diapositiva {
  imagen: string;
  alt: string;
  enlace: string;
}

/** Carrusel de imágenes con enlaces: avanza solo y se detiene mientras el cursor o el foco están encima. */
@Component({
  selector: 'app-carousel',
  imports: [RouterLink],
  templateUrl: './carousel.html',
})
export class Carousel implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly diapositivas = input.required<Diapositiva[]>();
  readonly intervaloMs = input(6000);
  /** Alto del carrusel: cualquier valor CSS válido. */
  readonly altura = input('clamp(220px, 42vw, 520px)');

  protected readonly actual = signal(0);
  protected readonly pausado = signal(false);

  ngOnInit(): void {
    const temporizador = setInterval(() => {
      if (!this.pausado()) {
        this.siguiente();
      }
    }, this.intervaloMs());
    this.destroyRef.onDestroy(() => clearInterval(temporizador));
  }

  protected siguiente(): void {
    this.mover(1);
  }

  protected anterior(): void {
    this.mover(-1);
  }

  protected ir(posicion: number): void {
    this.actual.set(posicion);
  }

  private mover(delta: number): void {
    const total = this.diapositivas().length;
    if (total > 0) {
      this.actual.update((i) => (i + delta + total) % total);
    }
  }
}