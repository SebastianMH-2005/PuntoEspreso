import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MetodoPago, PedidoResponse } from '../../core/models/pedido.models';
import { Sede } from '../../core/models/sede.models';
import { CartService } from '../../core/services/cart.service';
import { PedidoService } from '../../core/services/pedido.service';
import { ProductoService } from '../../core/services/producto.service';
import { SedeService } from '../../core/services/sede.service';
import { mensajeDeError } from '../../core/utils/mensaje-error';
import { noSoloEspacios, tarjetaNoVencida } from '../../core/validators/form.validators';
import { FieldError } from '../../shared/field-error/field-error';

type Campo = 'idSede' | 'metodoPago' | 'titular' | 'numeroTarjeta' | 'vencimiento' | 'cvv';
type CampoNumerico = 'numeroTarjeta' | 'vencimiento' | 'cvv';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, FieldError],
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sedeService = inject(SedeService);
  private readonly productoService = inject(ProductoService);
  private readonly pedidoService = inject(PedidoService);
  protected readonly cart = inject(CartService);

  protected readonly sedes = signal<Sede[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorStock = signal(false);
  protected readonly pedido = signal<PedidoResponse | null>(null);

  // El pago es simulado: los datos de la tarjeta solo se validan aquí y NUNCA se envían ni se guardan.
  protected readonly form = this.fb.group({
    idSede: this.fb.control<number | null>(null, Validators.required),
    metodoPago: this.fb.control<MetodoPago>('CC', Validators.required),
    titular: [
      '',
      [Validators.required, noSoloEspacios, Validators.minLength(3), Validators.maxLength(60)],
    ],
    numeroTarjeta: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    vencimiento: [
      '',
      [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/), tarjetaNoVencida],
    ],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    if (this.cart.items().length === 0) {
      this.router.navigateByUrl('/carrito');
      return;
    }

    this.cargando.set(true);
    this.errorCarga.set(false);
    forkJoin({ sedes: this.sedeService.listar(), productos: this.productoService.listar() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ sedes, productos }) => {
          // Si cambió un precio o el stock desde que agregaste los productos, vuelves al carrito con el aviso
          const avisos = this.cart.sincronizar(productos);
          if (avisos.length > 0 || this.cart.items().length === 0) {
            this.router.navigateByUrl('/carrito');
            return;
          }
          this.sedes.set(sedes);
          if (sedes.length > 0) {
            this.form.controls.idSede.setValue(sedes[0].idSede);
          }
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.errorCarga.set(true);
        },
      });
  }

  protected invalido(campo: Campo): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Deja solo dígitos y da formato al escribir (16 dígitos, MM/AA, 3 dígitos). */
  protected alEscribir(campo: CampoNumerico, evento: Event): void {
    const digitos = (evento.target as HTMLInputElement).value.replace(/\D/g, '');
    let limpio: string;
    if (campo === 'numeroTarjeta') {
      limpio = digitos.slice(0, 16);
    } else if (campo === 'cvv') {
      limpio = digitos.slice(0, 3);
    } else {
      limpio = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}` : digitos;
    }
    this.form.controls[campo].setValue(limpio);
  }

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { idSede, metodoPago } = this.form.getRawValue();
    if (idSede === null) {
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    this.errorStock.set(false);

    this.pedidoService
      .crear({
        idSede,
        metodoPago,
        items: this.cart.items().map((item) => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          instrucciones: item.instrucciones?.trim() ? item.instrucciones.trim() : null,
        })),
      })
      .subscribe({
        next: (respuesta) => {
          this.enviando.set(false);
          this.cart.vaciar();
          this.pedido.set(respuesta);
        },
        error: (fallo: unknown) => {
          this.enviando.set(false);
          this.errorStock.set(fallo instanceof HttpErrorResponse && fallo.status === 409);
          this.error.set(
            mensajeDeError(fallo, 'No pudimos procesar tu pedido. Inténtalo de nuevo.'),
          );
        },
      });
  }
}