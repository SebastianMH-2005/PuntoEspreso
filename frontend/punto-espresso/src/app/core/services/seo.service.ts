import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const DESCRIPCION_POR_DEFECTO =
  'Cafetería y tostaduría en Lima. Café de especialidad, geisha, frappés, cold brew y bebidas frías. ' +
  'Visítanos en San Miguel y San Isidro o pide en línea.';

/**
 * Actualiza descripción, canonical y robots en cada navegación.
 * Cada ruta puede definir en "data": { descripcion: '...', noindex: true }
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe(() => this.actualizar());
  }

  private actualizar(): void {
    const ruta = this.rutaActiva();
    const datos = ruta.data;
    const descripcion = (datos['descripcion'] as string | undefined) ?? DESCRIPCION_POR_DEFECTO;
    // "noindex" de una ruta padre (por ejemplo /admin) vale para todas sus rutas hijas
    const noindex = ruta.pathFromRoot.some((tramo) => tramo.data['noindex'] === true);
    const url = this.document.location.origin + this.router.url.split(/[?#]/)[0];

    this.meta.updateTag({ name: 'description', content: descripcion });
    this.meta.updateTag({
      name: 'robots',
      content: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });
    this.meta.updateTag({ property: 'og:title', content: this.document.title });
    this.meta.updateTag({ property: 'og:description', content: descripcion });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.actualizarCanonical(url);
  }

  private rutaActiva(): ActivatedRouteSnapshot {
    let ruta = this.router.routerState.snapshot.root;
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }
    return ruta;
  }

  private actualizarCanonical(url: string): void {
    let enlace = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!enlace) {
      enlace = this.document.createElement('link');
      enlace.rel = 'canonical';
      this.document.head.appendChild(enlace);
    }
    enlace.href = url;
  }
}