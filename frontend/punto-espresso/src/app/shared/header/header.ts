import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuarioAbierto = signal(false);
  protected readonly primerNombre = computed(
    () => (this.auth.nombre() ?? '').trim().split(/\s+/)[0] ?? '',
  );
  protected readonly inicial = computed(() => this.primerNombre().charAt(0).toUpperCase() || '?');

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

    protected alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenuUsuario(): void {
    this.menuUsuarioAbierto.set(false);
  }

  // El menú se cierra al hacer clic en cualquier otro lugar de la página
  @HostListener('document:click', ['$event'])
  protected alHacerClic(evento: Event): void {
    const destino = evento.target as Element | null;
    if (!destino?.closest?.('.menu-usuario')) {
      this.cerrarMenuUsuario();
    }
  }

  @HostListener('document:keydown.escape')
  protected alPulsarEscape(): void {
    this.cerrarMenuUsuario();
  }

  protected cerrarSesion(): void {
    this.cerrarMenu();
    this.cart.vaciar();
    const nombre = this.primerNombre();
    this.cerrarMenuUsuario();
    this.auth.cerrarSesion(
      nombre ? `/hasta-pronto?nombre=${encodeURIComponent(nombre)}` : '/hasta-pronto',
    );
  }
}