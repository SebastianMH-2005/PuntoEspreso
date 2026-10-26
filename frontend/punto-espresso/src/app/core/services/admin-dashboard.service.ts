import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dashboard } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly http = inject(HttpClient);

  /** Resumen de ventas de los últimos `dias` días (el backend acepta de 1 a 31). */
  obtener(dias: number): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${environment.apiUrl}/api/admin/dashboard`, {
      params: new HttpParams().set('dias', dias),
    });
  }
}