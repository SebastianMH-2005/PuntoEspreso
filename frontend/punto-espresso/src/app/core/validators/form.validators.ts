import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Rechaza un vencimiento MM/AA que ya pasó (la tarjeta vale hasta el fin de ese mes). */
export const tarjetaNoVencida: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const partes = /^(\d{2})\/(\d{2})$/.exec(String(control.value ?? ''));
  if (!partes) {
    return null; // el formato lo valida Validators.pattern
  }
  const mes = Number(partes[1]);
  const anio = 2000 + Number(partes[2]);
  const hoy = new Date();
  const vencida =
    anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
  return vencida ? { vencida: true } : null;
};

/** Valida que dos campos del grupo tengan el mismo valor (por ejemplo contraseña y confirmación). */
export function camposIguales(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null =>
    grupo.get(campo)?.value === grupo.get(confirmacion)?.value ? null : { noCoinciden: true };
}

/** Rechaza textos formados solo por espacios (Validators.required los deja pasar). */
export const noSoloEspacios: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor: unknown = control.value;
  return typeof valor === 'string' && valor.length > 0 && valor.trim() === ''
    ? { required: true }
    : null;
};