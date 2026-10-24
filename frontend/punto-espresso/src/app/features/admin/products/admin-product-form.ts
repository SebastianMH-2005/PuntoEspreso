import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Categoria, ProductoRequest } from '../../../core/models/producto.models';
import { AdminProductoService } from '../../../core/services/admin-producto.service';
import { ProductoService } from '../../../core/services/producto.service';
import { mensajeDeError } from '../../../core/utils/mensaje-error';
import { esEntero, noSoloEspacios } from '../../../core/validators/form.validators';
import { FieldError } from '../../../shared/field-error/field-error';

type Campo = 'idCategoria' | 'nombre' | 'descripcion' | 'precio' | 'stock' | 'imagen';

// Mismas reglas que valida el backend (ProductoRequest)
const PATRON_IMAGEN = /^[\w-]+\.(jpg|jpeg|png|webp)$/;
const MAX_DESCRIPCION = 255;

@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './admin-product-form.html',
})
export class AdminProductForm implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly servicio = inject(AdminProductoService);
  private readonly productoService = inject(ProductoService);

  // Parámetro de la ruta /admin/productos/:id/editar; en /nuevo no existe
  readonly id = input<string>();

  protected readonly maxDescripcion = MAX_DESCRIPCION;
  protected readonly esEdicion = computed(() => this.id() !== undefined);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly carga = signal<'cargando' | 'listo' | 'error'>('cargando');
  protected readonly errorCarga = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly imagenNoEncontrada = signal<string | null>(null);

  protected readonly form = this.fb.group({
    idCategoria: this.fb.control<number | null>(null, Validators.required),
    nombre: ['', [Validators.required, noSoloEspacios, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, noSoloEspacios, Validators.maxLength(MAX_DESCRIPCION)]],
    precio: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(9999.99),
    ]),
    stock: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100000),
      esEntero,
    ]),
    imagen: ['', [Validators.required, Validators.pattern(PATRON_IMAGEN)]],
  });

  // Los controles no son señales: estos dos puentes dejan la vista al día mientras se escribe
  protected readonly imagen = toSignal(this.form.controls.imagen.valueChanges, {
    initialValue: '',
  });
  protected readonly longitudDescripcion = toSignal(this.form.controls.descripcion.valueChanges, {
    initialValue: '',
  });
  protected readonly vistaPreviaValida = computed(() => PATRON_IMAGEN.test(this.imagen()));

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.carga.set('cargando');
    const id = this.id();
    const idProducto = Number(id);
    if (id !== undefined && !Number.isInteger(idProducto)) {
      this.errorCarga.set('El producto que intentas editar no es válido.');
      this.carga.set('error');
      return;
    }

    forkJoin({
      categorias: this.productoService.listarCategorias(),
      producto: id === undefined ? of(null) : this.productoService.obtener(idProducto),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categorias, producto }) => {
          this.categorias.set(categorias);
          if (producto) {
            this.form.patchValue({
              idCategoria: producto.categoria?.idCategoria ?? null,
              nombre: producto.nombre,
              descripcion: producto.descripcion,
              precio: producto.precio,
              stock: producto.stock,
              imagen: producto.imagen,
            });
          }
          this.carga.set('listo');
        },
        error: (fallo: unknown) => {
          this.errorCarga.set(mensajeDeError(fallo, 'No pudimos cargar los datos del formulario.'));
          this.carga.set('error');
        },
      });
  }

  protected invalido(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    if (valores.idCategoria === null || valores.precio === null || valores.stock === null) {
      return;
    }

    const producto: ProductoRequest = {
      idCategoria: valores.idCategoria,
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      precio: Math.round(valores.precio * 100) / 100,
      stock: valores.stock,
      imagen: valores.imagen.trim(),
    };

    this.enviando.set(true);
    this.error.set(null);
    const id = this.id();
    const peticion =
      id === undefined
        ? this.servicio.crear(producto)
        : this.servicio.actualizar(Number(id), producto);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/admin/productos'], {
          queryParams: { aviso: id === undefined ? 'creado' : 'actualizado' },
        });
      },
      error: (fallo: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(fallo, 'No pudimos guardar el producto. Inténtalo de nuevo.'));
      },
    });
  }
}