import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, RegistroRequest, Rol } from '../models/auth.models';

const CLAVE_TOKEN = 'token';
const CLAVE_NOMBRE = 'nombre';
const CLAVE_ROL = 'rol';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = `${environment.apiUrl}/api/auth`;

  // El token se lee primero: si venció, limpia también el nombre y el rol guardados
  private readonly _token = signal<string | null>(this.leerTokenVigente());
  private readonly _nombre = signal<string | null>(localStorage.getItem(CLAVE_NOMBRE));
  private readonly _rol = signal<Rol | null>(localStorage.getItem(CLAVE_ROL) as Rol | null);

  readonly token = this._token.asReadonly();
  readonly nombre = this._nombre.asReadonly();
  readonly rol = this._rol.asReadonly();

  readonly estaLogueado = computed(() => this._token() !== null);
  readonly esCliente = computed(() => this._rol() === 'CLIENTE');
  readonly esPersonal = computed(() => this._rol() === 'ADMIN' || this._rol() === 'OPERADOR');

  login(datos: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${this.api}/login`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  registro(datos: RegistroRequest) {
    return this.http.post<void>(`${this.api}/registro`, datos);
  }

  cerrarSesion(destino = '/'): void {
    this.limpiarAlmacenamiento();
    this._token.set(null);
    this._nombre.set(null);
    this._rol.set(null);
    this.router.navigateByUrl(destino);
  }

  private guardarSesion(respuesta: LoginResponse): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_NOMBRE, respuesta.nombre);
    localStorage.setItem(CLAVE_ROL, respuesta.rol);
    this._token.set(respuesta.token);
    this._nombre.set(respuesta.nombre);
    this._rol.set(respuesta.rol);
  }

  private leerTokenVigente(): string | null {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (token && this.tokenVigente(token)) {
      return token;
    }
    this.limpiarAlmacenamiento();
    return null;
  }

  private tokenVigente(token: string): boolean {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64)) as { exp?: number };
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private limpiarAlmacenamiento(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_NOMBRE);
    localStorage.removeItem(CLAVE_ROL);
  }
}