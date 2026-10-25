/** Datos que el administrador envía para crear o editar una sede. */
export interface SedeRequest {
  nombre: string;
  direccion: string;
  horarioDias: string;
  horarioHoras: string;
}

export interface Sede {
  idSede: number;
  nombre: string;
  direccion: string;
  horarioDias: string;
  horarioHoras: string;
}