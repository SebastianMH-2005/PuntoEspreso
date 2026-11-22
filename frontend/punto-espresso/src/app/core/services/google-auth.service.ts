import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface RespuestaGoogle {
  credential: string;
}

// La parte de Google Identity Services que usamos (el script oficial la crea en window.google)
interface GoogleIdentity {
  accounts: {
    id: {
      initialize(opciones: { client_id: string; callback: (respuesta: RespuestaGoogle) => void }): void;
      renderButton(contenedor: HTMLElement, opciones: Record<string, string | number>): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const URL_SCRIPT_GOOGLE = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly document = inject(DOCUMENT);
  private cargaDelScript?: Promise<void>;

  /** El botón solo se ofrece si hay un ID de cliente de Google configurado en el environment. */
  readonly disponible = environment.googleClientId.trim() !== '';

  /**
   * Dibuja el botón oficial "Continuar con Google" dentro de `contenedor`. Cuando la persona elige
   * su cuenta, Google entrega una credencial (un JWT firmado) que se pasa a `alRecibir`.
   * El script de Google se descarga recién aquí: solo en las pantallas de login y registro.
   */
  async dibujarBoton(
    contenedor: HTMLElement,
    alRecibir: (credencial: string) => void,
  ): Promise<void> {
    if (!this.disponible) {
      return;
    }
    await this.cargarScript();
    const google = this.document.defaultView?.google;
    if (!google) {
      return;
    }
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (respuesta) => alRecibir(respuesta.credential),
    });
    google.accounts.id.renderButton(contenedor, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: 280,
      locale: 'es',
    });
  }

  private cargarScript(): Promise<void> {
    this.cargaDelScript ??= new Promise<void>((resolver, rechazar) => {
      if (this.document.defaultView?.google) {
        resolver();
        return;
      }
      const script = this.document.createElement('script');
      script.src = URL_SCRIPT_GOOGLE;
      script.async = true;
      script.defer = true;
      script.onload = () => resolver();
      script.onerror = () => {
        this.cargaDelScript = undefined; // permite reintentar más tarde
        rechazar(new Error('No se pudo cargar el script de Google'));
      };
      this.document.head.appendChild(script);
    });
    return this.cargaDelScript;
  }
}