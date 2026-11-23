import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Términos y condiciones de uso (los pide Google para publicar "Continuar con Google"). */
@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  templateUrl: './terms.html',
})
export class Terms {
  protected readonly correo = 'contacto@puntoespresso.pe';
  protected readonly actualizacion = '22 de noviembre de 2026';
}