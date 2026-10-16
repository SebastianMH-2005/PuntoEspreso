package com.puntoespresso.puntoespresso.pedido;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PedidoRequest(
        @NotNull(message = "El producto es obligatorio") Integer idProducto,
        @Min(value = 1, message = "La cantidad mínima es 1")
        @Max(value = 50, message = "La cantidad máxima por pedido es 50") int cantidad,
        @Size(max = 200, message = "Las instrucciones no pueden superar los 200 caracteres") String instrucciones,
        @NotBlank(message = "El método de pago es obligatorio")
        @Pattern(regexp = "CC|DC", message = "Método de pago inválido") String metodoPago) {
}