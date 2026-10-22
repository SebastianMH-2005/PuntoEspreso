import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EstadoPedido, MiPedido } from '../../core/models/pedido.models';
import { PedidoService } from '../../core/services/pedido.service';
import { mensajeDeError } from '../../core/utils/mensaje-error';

type Carga = 'cargando' | 'listo' | 'error';
type Filtro = 'todos' | 'activos' | 'historial';
type Modo = 'inicial' | 'manual' | 'auto';

const ESTADOS: Record<EstadoPedido, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'bg-warning text-dark' },
  EN_PROCESO: { texto: 'En proceso', clase: 'bg-info text-dark' },
  LISTO: { texto: 'Listo para recoger', clase: 'bg-success' },
  ENTREGADO: { texto: 'Entregado', clase: 'bg-secondary' },
  CANCELADO: { texto: 'Cancelado', clase: 'bg-danger' },
};
const ACTIVOS: EstadoPedido[] = ['PENDIENTE', 'EN_PROCESO', 'LISTO'];
const INTERVALO_REFRESCO_MS = 30_000;

@Component({
  selector: 'app-orders',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly pedidoService = inject(PedidoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly actualizando = signal(false);
  protected readonly pedidos = signal<MiPedido[]>([]);
  protected readonly filtro = signal<Filtro>('todos');
  protected readonly cancelando = signal<number | null>(null);
  protected readonly mensaje = signal<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    return this.pedidos().filter(
      (pedido) => filtro === 'todos' || (filtro === 'activos') === ACTIVOS.includes(pedido.estado),
    );
  });

  private temporizadorLento?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargar('inicial');
    // Mientras la página está abierta, el estado de los pedidos se actualiza solo
    const intervalo = setInterval(() => this.cargar('auto'), INTERVALO_REFRESCO_MS);
    this.destroyRef.onDestroy(() => {
      clearInterval(intervalo);
      clearTimeout(this.temporizadorLento);
    });
  }

  protected cargar(modo: Modo): void {
    if (modo === 'inicial') {
      this.carga.set('cargando');
      this.servidorLento.set(false);
      // Render duerme el servidor gratuito: si tarda, avisamos al visitante
      this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);
    } else {
      this.actualizando.set(true);
    }

    this.pedidoService
      .misPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pedidos) => {
          clearTimeout(this.temporizadorLento);
          this.actualizando.set(false);
          this.pedidos.set(pedidos);
          this.carga.set('listo');
        },
        error: (fallo: unknown) => {
          clearTimeout(this.temporizadorLento);
          this.actualizando.set(false);
          if (modo === 'inicial') {
            this.carga.set('error');
          } else if (modo === 'manual') {
            this.mensaje.set({
              tipo: 'error',
              texto: mensajeDeError(fallo, 'No pudimos actualizar tus pedidos.'),
            });
          } // en la actualización automática un fallo no interrumpe al cliente
        },
      });
  }

  protected estado(pedido: MiPedido): { texto: string; clase: string } {
    return ESTADOS[pedido.estado] ?? { texto: pedido.estado, clase: 'bg-secondary' };
  }

  protected cancelar(pedido: MiPedido): void {
    if (!confirm(`¿Cancelar el pedido ${pedido.codigoUnico}? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.cancelando.set(pedido.idOrden);
    this.mensaje.set(null);
    this.pedidoService
      .cancelar(pedido.idOrden)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.cancelando.set(null);
          this.pedidos.update((lista) =>
            lista.map((p) => (p.idOrden === actualizado.idOrden ? actualizado : p)),
          );
          this.mensaje.set({
            tipo: 'exito',
            texto: `Cancelaste el pedido ${actualizado.codigoUnico}.`,
          });
        },
        error: (fallo: unknown) => {
          this.cancelando.set(null);
          this.mensaje.set({
            tipo: 'error',
            texto: mensajeDeError(fallo, 'No pudimos cancelar el pedido. Inténtalo de nuevo.'),
          });
          // Probablemente el pedido ya cambió de estado: se vuelve a leer la lista
          this.cargar('manual');
        },
      });
  }
}