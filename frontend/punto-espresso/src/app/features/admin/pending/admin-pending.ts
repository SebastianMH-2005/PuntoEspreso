import { Component, input } from '@angular/core';
import { environment } from '../../../../environments/environment';

/** Sección todavía no migrada a Angular: manda al panel anterior, que sigue funcionando. */
@Component({
  selector: 'app-admin-pending',
  templateUrl: './admin-pending.html',
})
export class AdminPending {
  // Llega desde "data: { seccion: '...' }" de la ruta (withComponentInputBinding)
  readonly seccion = input('Esta sección');
  protected readonly panelAnterior = `${environment.apiUrl}/admin`;
}