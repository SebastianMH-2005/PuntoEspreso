import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error de la API en un texto que se pueda mostrar al usuario. */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return porDefecto;
  }
  if (error.status === 0) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }

  const cuerpo: unknown = error.error;
  // Texto plano corto (por ejemplo "Ya existe una cuenta con ese email"); se ignoran páginas HTML de error
  if (typeof cuerpo === 'string') {
    const texto = cuerpo.trim();
    return texto !== '' && texto.length <= 200 && !texto.startsWith('<') ? texto : porDefecto;
  }
  // JSON de la API: { status, error, message, path }
  if (typeof cuerpo === 'object' && cuerpo !== null && 'message' in cuerpo) {
    return typeof cuerpo.message === 'string' && cuerpo.message !== ''
      ? cuerpo.message
      : porDefecto;
  }
  return porDefecto;
}