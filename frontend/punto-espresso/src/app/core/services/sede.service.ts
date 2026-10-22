import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sede } from '../models/sede.models';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly http = inject(HttpClient);

  listar(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${environment.apiUrl}/api/sedes`);
  }
}