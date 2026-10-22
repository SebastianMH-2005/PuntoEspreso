import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PedidoRequest, PedidoResponse } from '../models/pedido.models';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);

  crear(pedido: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${environment.apiUrl}/api/pedidos`, pedido);
  }
}