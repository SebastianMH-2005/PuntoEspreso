import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Política de privacidad (la pide Google para publicar "Continuar con Google"). */
@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  templateUrl: './privacy.html',
})
export class Privacy {
  protected readonly correo = 'contacto@puntoespresso.pe';
  protected readonly actualizacion = '22 de noviembre de 2026';
}