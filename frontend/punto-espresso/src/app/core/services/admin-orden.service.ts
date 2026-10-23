import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrdenAdmin } from '../models/admin.models';
import { EstadoPedido } from '../models/pedido.models';

@Injectable({ providedIn: 'root' })
export class AdminOrdenService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/admin/ordenes`;

  /** Todas las órdenes, de la más reciente a la más antigua; opcionalmente solo las de un estado. */
  listar(estado?: EstadoPedido): Observable<OrdenAdmin[]> {
    const params = estado ? new HttpParams().set('estado', estado) : undefined;
    return this.http.get<OrdenAdmin[]>(this.api, { params });
  }

  cambiarEstado(idOrden: number, estado: EstadoPedido): Observable<OrdenAdmin> {
    return this.http.put<OrdenAdmin>(`${this.api}/${idOrden}/estado`, { estado });
  }
}