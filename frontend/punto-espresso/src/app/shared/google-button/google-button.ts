import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { mensajeDeError } from '../../core/utils/mensaje-error';

/** Botón "Continuar con Google": solo aparece si hay un ID de cliente de Google configurado. */
@Component({
  selector: 'app-google-button',
  templateUrl: './google-button.html',
})
export class GoogleButton implements AfterViewInit {
  protected readonly google = inject(GoogleAuthService);
  private readonly auth = inject(AuthService);

  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');

  /** Se emite cuando la sesión ya quedó iniciada. */
  readonly iniciada = output<void>();
  /** Se emite con el texto del problema si Google o el servidor rechazan el ingreso. */
  readonly fallo = output<string>();

  protected readonly entrando = signal(false);

  ngAfterViewInit(): void {
    const elemento = this.contenedor()?.nativeElement;
    if (!elemento) {
      return;
    }
    this.google
      .dibujarBoton(elemento, (credencial) => this.entrar(credencial))
      .catch(() =>
        this.fallo.emit(
          'No pudimos cargar el inicio de sesión con Google. Prueba con tu correo y contraseña.',
        ),
      );
  }

  private entrar(credencial: string): void {
    this.entrando.set(true);
    this.auth.loginConGoogle(credencial).subscribe({
      next: () => {
        this.entrando.set(false);
        this.iniciada.emit();
      },
      error: (problema: unknown) => {
        this.entrando.set(false);
        this.fallo.emit(
          problema instanceof HttpErrorResponse && problema.status === 401
            ? 'No pudimos verificar tu cuenta de Google. Inténtalo de nuevo.'
            : mensajeDeError(problema, 'No pudimos iniciar sesión con Google. Inténtalo de nuevo.'),
        );
      },
    });
  }
}