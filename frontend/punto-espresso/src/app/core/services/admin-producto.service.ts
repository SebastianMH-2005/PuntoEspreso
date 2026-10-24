import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto, ProductoRequest } from '../models/producto.models';

@Injectable({ providedIn: 'root' })
export class AdminProductoService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/admin/productos`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.api);
  }

  crear(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.api, producto);
  }

  actualizar(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.api}/${id}`, producto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}