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
                @NotBlank(message = "El método de pago es obligatorio") @Pattern(regexp = "CC|DC", message = "Método de pago inválido") String metodoPago) {
}