package com.puntoespresso.puntoespresso.pedido;

public record PedidoResponse(String codigoUnico, String nombreProducto, int cantidad, double total) {
}