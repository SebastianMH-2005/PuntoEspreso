package com.puntoespresso.puntoespresso.pedido;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ItemPedidoRequest(
        @NotNull(message = "El producto es obligatorio") Integer idProducto,
        @Min(value = 1, message = "La cantidad mínima es 1")
        @Max(value = 50, message = "La cantidad máxima por producto es 50") int cantidad,
        @Size(max = 200, message = "Las instrucciones no pueden superar los 200 caracteres") String instrucciones) {
}