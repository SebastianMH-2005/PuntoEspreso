import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SeoService } from './core/services/seo.service';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';

@Component({
  imports: [RouterOutlet, Header, Footer],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
    constructor() {
    // El título de cada página lo define el router (propiedad "title" en app.routes.ts);
    // SeoService completa descripción, canonical y robots en cada navegación
    inject(SeoService);
  }
}
