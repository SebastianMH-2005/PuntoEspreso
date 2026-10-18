package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.admin.DetalleResponse;

import java.time.LocalDateTime;
import java.util.List;

public record MiOrdenResponse(Integer idOrden, String codigoUnico, String estado, String tipoEntrega,
                              String metodoPago, double total, LocalDateTime fechaCreacion, String sedeNombre,
                              List<DetalleResponse> detalles) {
}