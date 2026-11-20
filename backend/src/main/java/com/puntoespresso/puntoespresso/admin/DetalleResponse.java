package com.puntoespresso.puntoespresso.admin;

import java.math.BigDecimal;
public record DetalleResponse(String productoNombre, int cantidad, BigDecimal precioUnitario) {
}