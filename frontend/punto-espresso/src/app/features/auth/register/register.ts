import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { camposIguales, noSoloEspacios } from '../../../core/validators/form.validators';
import { mensajeDeError } from '../../../core/utils/mensaje-error';
import { FieldError } from '../../../shared/field-error/field-error';

type Campo = 'nombre' | 'dni' | 'email' | 'telefono' | 'contrasena' | 'confirmacion';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  // Las mismas reglas que valida el backend (RegistroClienteRequest)
  protected readonly form = this.fb.group(
    {
      nombre: [
        '',
        [Validators.required, noSoloEspacios, Validators.minLength(2), Validators.maxLength(100)],
      ],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      contrasena: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacion: ['', [Validators.required]],
    },
    { validators: camposIguales('contrasena', 'confirmacion') },
  );
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verContrasena = signal(false);

  protected invalido(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected confirmacionNoCoincide(): boolean {
    const confirmacion = this.form.controls.confirmacion;
    return this.form.hasError('noCoinciden') && !confirmacion.errors && confirmacion.touched;
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const { nombre, dni, email, telefono, contrasena } = this.form.getRawValue();

    this.auth
      .registro({
        nombre: nombre.trim(),
        dni,
        email: email.trim().toLowerCase(),
        telefono,
        contrasena,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.router.navigate(['/login'], { queryParams: { registrado: '1' } });
        },
        error: (fallo: unknown) => {
          this.enviando.set(false);
          this.error.set(mensajeDeError(fallo, 'No pudimos crear tu cuenta. Inténtalo de nuevo.'));
        },
      });
  }
}