package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.admin.DetalleResponse;
import java.math.BigDecimal;
import java.util.List;

public record PedidoResponse(String codigoUnico, BigDecimal total, String sedeNombre, List<DetalleResponse> detalles) {
}