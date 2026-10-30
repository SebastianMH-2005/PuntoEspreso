import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.html',
})
export class About {
  protected readonly compromisos = [
    {
      icono: 'bi-heart',
      titulo: 'Pasión',
      texto: 'Cuidamos minuciosamente cada detalle del filtrado y la temperatura.',
    },
    {
      icono: 'bi-award',
      titulo: 'Calidad',
      texto: 'Granos 100% Arábica con certificación de especialidad superior.',
    },
    {
      icono: 'bi-people',
      titulo: 'Comunidad',
      texto: 'Fomentamos el comercio justo respetando el pago a nuestros agricultores.',
    },
  ];
}