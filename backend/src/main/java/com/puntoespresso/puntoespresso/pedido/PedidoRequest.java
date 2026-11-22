package com.puntoespresso.puntoespresso.pedido;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PedidoRequest(
                @NotEmpty(message = "El pedido debe tener al menos un producto") @Size(max = 20, message = "Un pedido no puede tener más de 20 productos distintos") @Valid List<ItemPedidoRequest> items,
                @NotNull(message = "Elige la sede donde recogerás tu pedido") Integer idSede,
                                @NotBlank(message = "El método de pago es obligatorio") @Pattern(regexp = "CC|DC|YAPE|PLIN", message = "Método de pago inválido") String metodoPago,
                @Pattern(regexp = "\\d{6,12}", message = "El número de operación debe tener entre 6 y 12 dígitos") String codigoOperacion) {

        // Pedidos con tarjeta: no llevan número de operación
        public PedidoRequest(List<ItemPedidoRequest> items, Integer idSede, String metodoPago) {
                this(items, idSede, metodoPago, null);
        }
}