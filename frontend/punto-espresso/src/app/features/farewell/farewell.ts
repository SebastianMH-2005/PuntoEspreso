import { Component, computed, DestroyRef, inject, input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

const ESPERA_MS = 8000;

/** Pantalla de despedida al cerrar sesión: vuelve sola al inicio pasados unos segundos. */
@Component({
  selector: 'app-farewell',
  imports: [RouterLink],
  templateUrl: './farewell.html',
  styleUrl: './farewell.scss',
})
export class Farewell implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Llega desde la URL (?nombre=Ana) gracias a withComponentInputBinding. */
  readonly nombre = input<string | undefined>();

  protected readonly nombreVisible = computed(() => (this.nombre() ?? '').trim().slice(0, 30));

  ngOnInit(): void {
    const temporizador = setTimeout(() => this.router.navigateByUrl('/'), ESPERA_MS);
    this.destroyRef.onDestroy(() => clearTimeout(temporizador));
  }
}