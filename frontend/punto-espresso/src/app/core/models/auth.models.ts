export type Rol = 'CLIENTE' | 'ADMIN' | 'OPERADOR';

export interface LoginRequest {
  email: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  rol: Rol;
}

export interface RegistroRequest {
  nombre: string;
  dni: string;
  email: string;
  contrasena: string;
  telefono: string;
}