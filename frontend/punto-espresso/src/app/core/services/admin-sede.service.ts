import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sede, SedeRequest } from '../models/sede.models';

@Injectable({ providedIn: 'root' })
export class AdminSedeService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/admin/sedes`;

  listar(): Observable<Sede[]> {
    return this.http.get<Sede[]>(this.api);
  }

  crear(sede: SedeRequest): Observable<Sede> {
    return this.http.post<Sede>(this.api, sede);
  }

  actualizar(id: number, sede: SedeRequest): Observable<Sede> {
    return this.http.put<Sede>(`${this.api}/${id}`, sede);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}