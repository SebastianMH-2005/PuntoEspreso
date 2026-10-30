import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Carousel, Diapositiva } from '../../shared/carousel/carousel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Carousel],
  templateUrl: './home.html',
})
export class Home {
  protected readonly diapositivas: Diapositiva[] = [
    { imagen: '/img/banner-suspiro.jpg', alt: 'Lanzamiento del café Suspiro', enlace: '/catalogo' },
    { imagen: '/img/especialidad-geisha.jpg', alt: 'Café de variedad Geisha', enlace: '/catalogo' },
    {
      imagen: '/img/especialidad-variedad.jpg',
      alt: 'Café de variedad premium',
      enlace: '/catalogo',
    },
  ];
}