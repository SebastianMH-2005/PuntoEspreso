package com.puntoespresso.puntoespresso.pedido;

public record PedidoRequest(Integer idProducto, int cantidad, String instrucciones, String metodoPago) {
}