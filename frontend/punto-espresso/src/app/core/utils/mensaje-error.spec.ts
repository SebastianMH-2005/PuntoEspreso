import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './mensaje-error';

describe('mensajeDeError', () => {
  const porDefecto = 'Algo salió mal';

  it('usa el texto plano que devuelve la API', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: 'Ya existe una cuenta con ese email',
    });
    expect(mensajeDeError(error, porDefecto)).toBe('Ya existe una cuenta con ese email');
  });

  it('usa el campo message del JSON de la API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'El DNI debe tener 8 dígitos' },
    });
    expect(mensajeDeError(error, porDefecto)).toBe('El DNI debe tener 8 dígitos');
  });

  it('avisa cuando no hay conexión con el servidor', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(mensajeDeError(error, porDefecto)).toContain('No se pudo conectar');
  });

  it('ignora páginas HTML de error y errores que no son de HTTP', () => {
    const html = new HttpErrorResponse({
      status: 502,
      error: '<html><body>Bad Gateway</body></html>',
    });
    expect(mensajeDeError(html, porDefecto)).toBe(porDefecto);
    expect(mensajeDeError(new Error('x'), porDefecto)).toBe(porDefecto);
  });
});