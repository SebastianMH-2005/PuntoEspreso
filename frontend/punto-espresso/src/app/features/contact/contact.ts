import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sede } from '../../core/models/sede.models';
import { SedeService } from '../../core/services/sede.service';
import { normalizarTexto } from '../../core/utils/texto';

type Carga = 'cargando' | 'listo' | 'error';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.html',
})
export class Contact implements OnInit {
  private readonly sedeService = inject(SedeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly email = 'contacto@puntoespresso.pe';
  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly busqueda = signal('');

  protected readonly visibles = computed(() => {
    const texto = normalizarTexto(this.busqueda().trim());
    return this.sedes().filter(
      (sede) => texto === '' || normalizarTexto(`${sede.nombre} ${sede.direccion}`).includes(texto),
    );
  });

  private temporizadorLento?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizadorLento));
    this.cargar();
  }

  protected cargar(): void {
    this.carga.set('cargando');
    this.servidorLento.set(false);
    // Render duerme el servidor gratuito: si tarda, avisamos
    this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);

    this.sedeService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sedes) => {
          clearTimeout(this.temporizadorLento);
          this.sedes.set(sedes);
          this.carga.set('listo');
        },
        error: () => {
          clearTimeout(this.temporizadorLento);
          this.carga.set('error');
        },
      });
  }

  /** Enlace a Google Maps con la dirección de la sede. */
  protected urlMapa(sede: Sede): string {
    const consulta = encodeURIComponent(`${sede.direccion}, Lima, Perú`);
    return `https://www.google.com/maps/search/?api=1&query=${consulta}`;
  }
}