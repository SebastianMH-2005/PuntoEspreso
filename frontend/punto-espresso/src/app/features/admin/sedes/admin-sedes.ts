import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Sede, SedeRequest } from '../../../core/models/sede.models';
import { AdminSedeService } from '../../../core/services/admin-sede.service';
import { mensajeDeError } from '../../../core/utils/mensaje-error';
import { noSoloEspacios } from '../../../core/validators/form.validators';
import { FieldError } from '../../../shared/field-error/field-error';

type Carga = 'cargando' | 'listo' | 'error';
type Campo = 'nombre' | 'direccion' | 'horarioDias' | 'horarioHoras';
// null = formulario cerrado; 'nueva' = creando; una Sede = editando esa sede
type Edicion = 'nueva' | Sede | null;

@Component({
  selector: 'app-admin-sedes',
  imports: [ReactiveFormsModule, FieldError],
  templateUrl: './admin-sedes.html',
})
export class AdminSedes implements OnInit {
  private readonly servicio = inject(AdminSedeService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly edicion = signal<Edicion>(null);
  protected readonly enviando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected readonly procesando = signal<number | null>(null);
  protected readonly mensaje = signal<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Mismos límites que valida el backend (SedeRequest)
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, noSoloEspacios, Validators.maxLength(100)]],
    direccion: ['', [Validators.required, noSoloEspacios, Validators.maxLength(200)]],
    horarioDias: ['', [Validators.required, noSoloEspacios, Validators.maxLength(60)]],
    horarioHoras: ['', [Validators.required, noSoloEspacios, Validators.maxLength(40)]],
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

    this.servicio
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

  protected invalido(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected nueva(): void {
    this.form.reset();
    this.errorFormulario.set(null);
    this.mensaje.set(null);
    this.edicion.set('nueva');
  }

  protected editar(sede: Sede): void {
    this.form.reset({
      nombre: sede.nombre,
      direccion: sede.direccion,
      horarioDias: sede.horarioDias,
      horarioHoras: sede.horarioHoras,
    });
    this.errorFormulario.set(null);
    this.mensaje.set(null);
    this.edicion.set(sede);
  }

  protected cancelar(): void {
    this.edicion.set(null);
  }

  protected guardar(): void {
    const actual = this.edicion();
    if (actual === null) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const sede: SedeRequest = {
      nombre: valores.nombre.trim(),
      direccion: valores.direccion.trim(),
      horarioDias: valores.horarioDias.trim(),
      horarioHoras: valores.horarioHoras.trim(),
    };

    this.enviando.set(true);
    this.errorFormulario.set(null);
    const peticion =
      actual === 'nueva'
        ? this.servicio.crear(sede)
        : this.servicio.actualizar(actual.idSede, sede);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (guardada) => {
        this.enviando.set(false);
        this.sedes.update((lista) =>
          actual === 'nueva'
            ? [...lista, guardada]
            : lista.map((s) => (s.idSede === guardada.idSede ? guardada : s)),
        );
        this.mensaje.set({
          tipo: 'exito',
          texto: `Sede «${guardada.nombre}» ${actual === 'nueva' ? 'creada' : 'actualizada'}.`,
        });
        this.edicion.set(null);
      },
      error: (fallo: unknown) => {
        this.enviando.set(false);
        this.errorFormulario.set(
          mensajeDeError(fallo, 'No pudimos guardar la sede. Inténtalo de nuevo.'),
        );
      },
    });
  }

  protected eliminar(sede: Sede): void {
    if (!confirm(`¿Eliminar la sede «${sede.nombre}»? Esta acción no se puede deshacer.`)) {
      return;
    }

    this.procesando.set(sede.idSede);
    this.mensaje.set(null);
    this.servicio
      .eliminar(sede.idSede)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.sedes.update((lista) => lista.filter((s) => s.idSede !== sede.idSede));
          this.mensaje.set({ tipo: 'exito', texto: `Sede «${sede.nombre}» eliminada.` });
        },
        error: (fallo: unknown) => {
          this.procesando.set(null);
          const base = mensajeDeError(fallo, 'No pudimos eliminar la sede.');
          // 409: la sede ya figura en pedidos y la base de datos no deja borrarla
          const pista =
            fallo instanceof HttpErrorResponse && fallo.status === 409
              ? ' Si la sede ya tiene pedidos, no se puede eliminar: edítala para actualizar sus datos.'
              : '';
          this.mensaje.set({ tipo: 'error', texto: base + pista });
        },
      });
  }
}