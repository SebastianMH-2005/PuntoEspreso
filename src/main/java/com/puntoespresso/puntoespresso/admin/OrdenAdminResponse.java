package com.puntoespresso.puntoespresso.admin;

import java.time.LocalDateTime;
import java.util.List;

public record OrdenAdminResponse(Integer idOrden, String clienteNombre, String clienteEmail, String tipoEntrega,
                                  String metodoPago, String estado, String codigoUnico, double total,
                                  LocalDateTime fechaCreacion, List<DetalleResponse> detalles) {
}