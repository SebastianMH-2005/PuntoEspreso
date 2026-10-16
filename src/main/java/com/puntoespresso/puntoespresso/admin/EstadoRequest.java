package com.puntoespresso.puntoespresso.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record EstadoRequest(
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(regexp = "PENDIENTE|EN_PROCESO|LISTO|ENTREGADO|CANCELADO", message = "Estado inválido") String estado) {
}