import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Rol } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';

interface Pestana {
  ruta: string;
  etiqueta: string;
  icono: string;
  roles: Rol[];
}

// Cada pestaña dice qué roles la ven. El backend vuelve a validar el rol en cada petición.
const PESTANAS: Pestana[] = [
  { ruta: 'ordenes', etiqueta: 'Órdenes', icono: 'bi-receipt', roles: ['ADMIN', 'OPERADOR'] },
  { ruta: 'productos', etiqueta: 'Productos', icono: 'bi-cup-hot', roles: ['ADMIN'] },
  { ruta: 'sedes', etiqueta: 'Sedes', icono: 'bi-geo-alt', roles: ['ADMIN'] },
  { ruta: 'personal', etiqueta: 'Personal', icono: 'bi-people', roles: ['ADMIN'] },
];

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  private readonly auth = inject(AuthService);

  protected readonly pestanas = computed(() => {
    const rol = this.auth.rol();
    return rol ? PESTANAS.filter((pestana) => pestana.roles.includes(rol)) : [];
  });
  protected readonly rolEtiqueta = computed(() =>
    this.auth.rol() === 'ADMIN' ? 'Administrador' : 'Operador',
  );
}