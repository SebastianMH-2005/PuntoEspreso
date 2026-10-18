package com.puntoespresso.puntoespresso.pedido;

import com.puntoespresso.puntoespresso.admin.DetalleResponse;

import java.util.List;

public record PedidoResponse(String codigoUnico, double total, String sedeNombre, List<DetalleResponse> detalles) {
}