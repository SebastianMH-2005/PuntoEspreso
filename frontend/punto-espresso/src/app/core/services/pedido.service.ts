import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MiPedido, PedidoRequest, PedidoResponse } from '../models/pedido.models';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);

  misPedidos(): Observable<MiPedido[]> {
    return this.http.get<MiPedido[]>(`${environment.apiUrl}/api/pedidos/mis-ordenes`);
  }

  cancelar(idOrden: number): Observable<MiPedido> {
    return this.http.put<MiPedido>(
      `${environment.apiUrl}/api/pedidos/mis-ordenes/${idOrden}/cancelar`,
      null,
    );
  }

  crear(pedido: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${environment.apiUrl}/api/pedidos`, pedido);
  }
}