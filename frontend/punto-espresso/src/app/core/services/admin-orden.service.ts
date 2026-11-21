import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrdenAdmin, PaginaOrdenes } from '../models/admin.models';
import { EstadoPedido } from '../models/pedido.models';

export const TAMANO_PAGINA = 20;

export interface FiltroOrdenes {
  estado?: EstadoPedido;
  busqueda?: string;
  pagina?: number; // empieza en 0
  tamano?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdenService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/admin/ordenes`;

 /** Una página de órdenes, de la más reciente a la más antigua; con filtro opcional por estado y búsqueda. */
 listar(filtros: FiltroOrdenes = {}): Observable<PaginaOrdenes> {
        let params = new HttpParams()
      .set('page', filtros.pagina ?? 0)
      .set('size', filtros.tamano ?? TAMANO_PAGINA);
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.busqueda) {
      params = params.set('q', filtros.busqueda);
    }
   return this.http.get<PaginaOrdenes>(this.api, { params });
  }

  cambiarEstado(idOrden: number, estado: EstadoPedido): Observable<OrdenAdmin> {
    return this.http.put<OrdenAdmin>(`${this.api}/${idOrden}/estado`, { estado });
  }
}