import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioSistema } from '../../../core/models/admin.models';
import { AdminUsuarioService } from '../../../core/services/admin-usuario.service';
import { mensajeDeError } from '../../../core/utils/mensaje-error';
import { noSoloEspacios } from '../../../core/validators/form.validators';
import { FieldError } from '../../../shared/field-error/field-error';

type Carga = 'cargando' | 'listo' | 'error';
type Campo = 'nombre' | 'email' | 'contrasena';

@Component({
  selector: 'app-admin-personal',
  imports: [ReactiveFormsModule, FieldError],
  templateUrl: './admin-personal.html',
})
export class AdminPersonal implements OnInit {
  private readonly servicio = inject(AdminUsuarioService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carga = signal<Carga>('cargando');
  protected readonly servidorLento = signal(false);
  protected readonly usuarios = signal<UsuarioSistema[]>([]);
  protected readonly enviando = signal(false);
  protected readonly errorFormulario = signal<string | null>(null);
  protected readonly verContrasena = signal(false);
  protected readonly procesando = signal<number | null>(null);
  protected readonly mensaje = signal<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Mismas reglas que valida el backend (UsuarioSistemaRequest)
  protected readonly form = this.fb.group({
    nombre: [
      '',
      [Validators.required, noSoloEspacios, Validators.minLength(2), Validators.maxLength(100)],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    contrasena: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
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
        next: (usuarios) => {
          clearTimeout(this.temporizadorLento);
          this.usuarios.set(usuarios);
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

  protected crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, email, contrasena } = this.form.getRawValue();
    this.enviando.set(true);
    this.errorFormulario.set(null);
    this.mensaje.set(null);

    this.servicio
      .crearOperador({ nombre: nombre.trim(), email: email.trim().toLowerCase(), contrasena })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (operador) => {
          this.enviando.set(false);
          this.usuarios.update((lista) => [...lista, operador]);
          this.form.reset();
          this.mensaje.set({
            tipo: 'exito',
            texto: `Operador «${operador.nombre}» creado. Entrégale su contraseña por un medio seguro.`,
          });
        },
        error: (fallo: unknown) => {
          this.enviando.set(false);
          this.errorFormulario.set(
            mensajeDeError(fallo, 'No pudimos crear el operador. Inténtalo de nuevo.'),
          );
        },
      });
  }

  protected eliminar(usuario: UsuarioSistema): void {
    if (!confirm(`¿Eliminar al operador «${usuario.nombre}»? No podrá volver a iniciar sesión.`)) {
      return;
    }

    this.procesando.set(usuario.idUsuarioSistema);
    this.mensaje.set(null);
    this.servicio
      .eliminar(usuario.idUsuarioSistema)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.procesando.set(null);
          this.usuarios.update((lista) =>
            lista.filter((u) => u.idUsuarioSistema !== usuario.idUsuarioSistema),
          );
          this.mensaje.set({ tipo: 'exito', texto: `Operador «${usuario.nombre}» eliminado.` });
        },
        error: (fallo: unknown) => {
          this.procesando.set(null);
          const base = mensajeDeError(fallo, 'No pudimos eliminar al operador.');
          // 409: el operador ya atendió pedidos y la base de datos no deja borrarlo
          const pista =
            fallo instanceof HttpErrorResponse && fallo.status === 409
              ? ' Si el operador ya atendió pedidos, no se puede eliminar.'
              : '';
          this.mensaje.set({ tipo: 'error', texto: base + pista });
        },
      });
  }
}