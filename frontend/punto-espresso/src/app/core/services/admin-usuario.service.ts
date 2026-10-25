import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OperadorRequest, UsuarioSistema } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminUsuarioService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/admin/usuarios`;

  listar(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.api);
  }

  crearOperador(operador: OperadorRequest): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.api, operador);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}