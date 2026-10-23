import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/utils/mensaje-error';
import { FieldError } from '../../../shared/field-error/field-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  // Parámetros de la URL (/login?redirect=/checkout&registrado=1); llegan por withComponentInputBinding()
  readonly redirect = input<string>();
  readonly registrado = input<string>();

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    contrasena: ['', [Validators.required]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verContrasena = signal(false);

  protected invalido(campo: 'email' | 'contrasena'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const { email, contrasena } = this.form.getRawValue();

    this.auth.login({ email: email.trim().toLowerCase(), contrasena }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl(this.destino());
      },
      error: (fallo: unknown) => {
        this.enviando.set(false);
        this.error.set(
          fallo instanceof HttpErrorResponse && fallo.status === 401
            ? 'Email o contraseña incorrectos.'
            : mensajeDeError(fallo, 'No pudimos iniciar sesión. Inténtalo de nuevo.'),
        );
      },
    });
  }

  // Solo se acepta una ruta interna: evita redirigir a otro sitio con /login?redirect=//otro-sitio.com
  private destino(): string {
    const ruta = this.redirect();
    if (ruta && ruta.startsWith('/') && !ruta.startsWith('//')) {
      return ruta;
    }
    return this.auth.esPersonal() ? '/admin' : '/';
  }
}