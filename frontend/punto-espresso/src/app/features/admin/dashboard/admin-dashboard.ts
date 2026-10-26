import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Dashboard } from '../../../core/models/admin.models';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { mensajeDeError } from '../../../core/utils/mensaje-error';

type Carga = 'cargando' | 'listo' | 'error';
type Modo = 'inicial' | 'manual' | 'auto';

const RANGOS_DIAS = [7, 14, 30];
const INTERVALO_REFRESCO_MS = 60_000;

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
  private readonly servicio = inject(AdminDashboardService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rangos = RANGOS_DIAS;
  protected readonly dias = signal(RANGOS_DIAS[0]);
  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly actualizando = signal(false);
  protected readonly errorActualizar = signal<string | null>(null);
  protected readonly datos = signal<Dashboard | null>(null);

  // Las barras se dibujan en proporción al valor más alto de cada lista
  protected readonly maxVenta = computed(() =>
    Math.max(1, ...(this.datos()?.ventasPorDia.map((dia) => dia.total) ?? [])),
  );
  protected readonly maxUnidades = computed(() =>
    Math.max(1, ...(this.datos()?.masVendidos.map((producto) => producto.unidades) ?? [])),
  );

  private peticion?: Subscription;
  private temporizadorLento?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargar('inicial');
    // Mientras el resumen está abierto, las cifras se actualizan solas
    const intervalo = setInterval(() => this.cargar('auto'), INTERVALO_REFRESCO_MS);
    this.destroyRef.onDestroy(() => {
      clearInterval(intervalo);
      clearTimeout(this.temporizadorLento);
      this.peticion?.unsubscribe();
    });
  }

  protected cargar(modo: Modo): void {
    // Si había una carga en curso (por ejemplo con otro rango), se descarta su respuesta
    this.peticion?.unsubscribe();

    if (modo === 'inicial') {
      this.carga.set('cargando');
      this.servidorLento.set(false);
      // Render duerme el servidor gratuito: si tarda, avisamos
      this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);
    } else {
      this.actualizando.set(true);
    }

    this.peticion = this.servicio.obtener(this.dias()).subscribe({
      next: (datos) => {
        clearTimeout(this.temporizadorLento);
        this.actualizando.set(false);
        this.errorActualizar.set(null);
        this.datos.set(datos);
        this.carga.set('listo');
      },
      error: (fallo: unknown) => {
        clearTimeout(this.temporizadorLento);
        this.actualizando.set(false);
        if (modo === 'inicial') {
          this.carga.set('error');
        } else if (modo === 'manual') {
          this.errorActualizar.set(mensajeDeError(fallo, 'No pudimos actualizar el resumen.'));
        } // en la actualización automática un fallo no interrumpe al administrador
      },
    });
  }

  protected cambiarRango(dias: number): void {
    this.dias.set(dias);
    this.cargar('manual');
  }

  protected porcentaje(valor: number, maximo: number): number {
    return Math.round((valor / maximo) * 100);
  }
}