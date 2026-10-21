import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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