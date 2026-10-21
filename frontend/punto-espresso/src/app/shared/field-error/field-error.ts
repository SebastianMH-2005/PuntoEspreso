import { Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

/** Muestra el primer error de validación de un campo, una vez que el usuario lo tocó o lo escribió. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (mensaje(); as texto) {
      <div class="invalid-feedback d-block">{{ texto }}</div>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  /** Mensajes propios del campo, por ejemplo { pattern: 'El DNI debe tener 8 dígitos.' } */
  readonly mensajes = input<Record<string, string>>({});

  // El estado de un control (tocado, errores...) no es una señal: se escuchan sus eventos
  // para que este componente se actualice cuando el formulario cambia por dentro.
  private readonly cambios = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => control.events.pipe(startWith(undefined))),
      map(() => ({})),
    ),
  );

  protected readonly mensaje = computed(() => {
    this.cambios();
    const control = this.control();
    if (!control.errors || !(control.touched || control.dirty)) {
      return null;
    }

    const [clave, detalle] = Object.entries(control.errors)[0];
    const propio = this.mensajes()[clave];
    if (propio) {
      return propio;
    }

    switch (clave) {
      case 'required':
        return 'Este campo es obligatorio.';
      case 'email':
        return 'Ingresa un email válido.';
      case 'minlength':
        return `Debe tener al menos ${detalle.requiredLength} caracteres.`;
      case 'maxlength':
        return `No puede superar los ${detalle.requiredLength} caracteres.`;
      default:
        return 'El valor ingresado no es válido.';
    }
  });
}