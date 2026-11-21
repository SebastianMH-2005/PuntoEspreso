import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrdenAdmin } from '../../../core/models/admin.models';
import { EstadoPedido } from '../../../core/models/pedido.models';
import { AdminOrdenService, FiltroOrdenes } from '../../../core/services/admin-orden.service';
import {
  ESTADOS_ACTIVOS,
  ESTADOS_PEDIDO,
  TODOS_LOS_ESTADOS,
} from '../../../core/utils/estado-pedido';
import { mensajeDeError } from '../../../core/utils/mensaje-error';


type Carga = 'cargando' | 'listo' | 'error';
type Modo = 'inicial' | 'manual' | 'auto';
interface Paso {
  estado: EstadoPedido;
  texto: string;
}

// El flujo normal de un pedido; cancelar se ofrece aparte mientras el pedido siga en marcha
const SIGUIENTE: Partial<Record<EstadoPedido, Paso>> = {
  PENDIENTE: { estado: 'EN_PROCESO', texto: 'Iniciar preparación' },
  EN_PROCESO: { estado: 'LISTO', texto: 'Marcar listo' },
  LISTO: { estado: 'ENTREGADO', texto: 'Marcar entregado' },
};
const INTERVALO_REFRESCO_MS = 20_000;

@Component({
  selector: 'app-admin-orders',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './admin-orders.html',
})
export class AdminOrders implements OnInit {
  private readonly servicio = inject(AdminOrdenService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly opcionesEstado = TODOS_LOS_ESTADOS.map((estado) => ({
    valor: estado,
    texto: ESTADOS_PEDIDO[estado].texto,
  }));

  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly actualizando = signal(false);
  protected readonly ordenes = signal<OrdenAdmin[]>([]);
  protected readonly filtroEstado = signal<EstadoPedido | ''>('');
  protected readonly busquedaControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(60)],
  });
    // Texto ya aplicado en el servidor: se busca al pulsar Buscar o Enter, no en cada tecla
  protected readonly busquedaActiva = signal('');
  protected readonly pagina = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly totalElementos = signal(0);
  protected readonly porAtender = signal(0);
  protected readonly estadoControl = new FormControl('', { nonNullable: true });
  protected readonly procesando = signal<number | null>(null);
  protected readonly mensaje = signal<{ tipo: 'exito' | 'error'; texto: string } | null>(null);


  private peticion?: Subscription;
  private temporizadorLento?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.cargar('inicial');
    // Al elegir otro estado en la lista, se vuelven a pedir las órdenes de ese estado
    this.estadoControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((valor) => this.cambiarFiltro(valor));
    // Las órdenes nuevas aparecen solas mientras el panel está abierto
    const intervalo = setInterval(() => this.cargar('auto'), INTERVALO_REFRESCO_MS);
    this.destroyRef.onDestroy(() => {
      clearInterval(intervalo);
      clearTimeout(this.temporizadorLento);
      this.peticion?.unsubscribe();
    });
  }

  protected cargar(modo: Modo): void {
    // Si había una carga en curso (por ejemplo con otro filtro), se descarta su respuesta
    this.peticion?.unsubscribe();

    if (modo === 'inicial') {
      this.carga.set('cargando');
      this.servidorLento.set(false);
      // Render duerme el servidor gratuito: si tarda, avisamos
      this.temporizadorLento = setTimeout(() => this.servidorLento.set(true), 4000);
    } else {
      this.actualizando.set(true);
    }

    this.peticion = this.servicio.listar(this.filtrosActuales()).subscribe({
      next: (respuesta) => {
        clearTimeout(this.temporizadorLento);
        this.actualizando.set(false);
                // Si la página pedida ya no existe (por ejemplo, se vaciaron las últimas), se retrocede
        if (respuesta.contenido.length === 0 && respuesta.totalPaginas > 0 && this.pagina() > 0) {
          this.pagina.set(respuesta.totalPaginas - 1);
          this.cargar('manual');
          return;
        }
        this.ordenes.set(respuesta.contenido);
        this.pagina.set(respuesta.pagina);
        this.totalPaginas.set(respuesta.totalPaginas);
        this.totalElementos.set(respuesta.totalElementos);
        this.porAtender.set(respuesta.pendientes);
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
            texto: mensajeDeError(fallo, 'No pudimos actualizar las órdenes.'),
          });
        } // en la actualización automática un fallo no interrumpe al personal
      },
    });
  }

    protected buscar(): void {
    this.busquedaActiva.set(this.busquedaControl.value.trim());
    this.pagina.set(0);
    this.cargar('manual');
  }

  protected limpiarBusqueda(): void {
    this.busquedaControl.setValue('');
    this.buscar();
  }

  protected irAPagina(pagina: number): void {
    if (pagina < 0 || pagina >= this.totalPaginas()) {
      return;
    }
    this.pagina.set(pagina);
    this.cargar('manual');
  }

  private filtrosActuales(): FiltroOrdenes {
    return {
      estado: this.filtroEstado() || undefined,
      busqueda: this.busquedaActiva() || undefined,
      pagina: this.pagina(),
    };
  }

  protected cambiarFiltro(valor: string): void {
        this.filtroEstado.set(TODOS_LOS_ESTADOS.find((estado) => estado === valor) ?? '');
    this.pagina.set(0);
    this.cargar('manual');
  }

  protected estado(orden: OrdenAdmin): { texto: string; clase: string } {
    return ESTADOS_PEDIDO[orden.estado] ?? { texto: orden.estado, clase: 'bg-secondary' };
  }

  protected siguiente(orden: OrdenAdmin): Paso | undefined {
    return SIGUIENTE[orden.estado];
  }

  protected puedeCancelar(orden: OrdenAdmin): boolean {
    return ESTADOS_ACTIVOS.includes(orden.estado);
  }

  protected avanzar(orden: OrdenAdmin, paso: Paso): void {
    this.cambiarEstado(orden, paso.estado);
  }

  protected cancelar(orden: OrdenAdmin): void {
    if (
      !confirm(
        `¿Cancelar el pedido ${orden.codigoUnico}? Se devolverá el stock y no se podrá reabrir.`,
      )
    ) {
      return;
    }
    this.cambiarEstado(orden, 'CANCELADO');
  }

  private cambiarEstado(orden: OrdenAdmin, estado: EstadoPedido): void {
    this.procesando.set(orden.idOrden);
    this.mensaje.set(null);

    this.servicio
      .cambiarEstado(orden.idOrden, estado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizada) => {
          this.procesando.set(null);
          const filtro = this.filtroEstado();
          // Con un filtro activo, el pedido sale de la lista al dejar de coincidir con ese estado
          this.ordenes.update((lista) =>
            filtro !== '' && actualizada.estado !== filtro
              ? lista.filter((o) => o.idOrden !== actualizada.idOrden)
              : lista.map((o) => (o.idOrden === actualizada.idOrden ? actualizada : o)),
          );
          this.mensaje.set({
            tipo: 'exito',
            texto: `Pedido ${actualizada.codigoUnico}: ${ESTADOS_PEDIDO[actualizada.estado].texto.toLowerCase()}.`,
          });
        },
        error: (fallo: unknown) => {
          this.procesando.set(null);
          this.mensaje.set({
            tipo: 'error',
            texto: mensajeDeError(fallo, 'No pudimos cambiar el estado del pedido.'),
          });
          // Probablemente otra persona ya lo modificó: se vuelve a leer la lista
          this.cargar('manual');
        },
      });
  }
}